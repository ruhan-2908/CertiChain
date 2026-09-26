# Build Spec: Certificate Management Module (upload-based)

## Context

Reuse existing modules, don't recreate them: `com.certichain.entity.User`, `com.certichain.entity.Student`, `com.certichain.repository.StudentRepository`, `com.certichain.exception.ApiException` (thrown as `new ApiException(HttpStatus, String)`, already caught globally by `GlobalExceptionHandler`), and the existing JWT/role security setup (`@PreAuthorize("hasRole('ADMIN')")`, `@AuthenticationPrincipal User user`). All new files go under `backend/src/main/java/com/certichain/`.

**Certificates are issued from an uploaded PDF, never generated.** The platform's job is to fingerprint and safely store a document the institution already produced — not create one.

**Two new shared services are needed by this module and must be built as part of it** (they will also be reused later by the Verification module, built by someone else — keep their method signatures stable):

- `service/HashingService.java` — computes SHA-256 over raw file bytes.
- `service/FileStorageService.java` — saves/loads/deletes certificate PDF files on local disk (fine for a college demo; swappable for cloud storage later without changing callers).

## 1. Entity — `entity/Certificate.java`

| Field | Type | Notes |
|---|---|---|
| `id` | `Long` | `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` |
| `certificateId` | `String` | unique, not null. Format: `CERT-{year}-{6-digit zero-padded number}`, e.g. `CERT-2026-000123` |
| `student` | `Student` | `@ManyToOne(fetch = FetchType.LAZY)`, not null |
| `courseName` | `String` | not null — e.g. "Semester 3", "Data Structures NPTEL" |
| `issueDate` | `LocalDate` | not null |
| `documentUrl` | `String` | path/location where the uploaded PDF is stored, set at creation |
| `documentHash` | `String` | SHA-256 hex string of the exact uploaded file bytes |
| `blockchainTxHash` | `String` | nullable until blockchain module exists — see stub note below |
| `blockchainNetwork` | `String` | nullable until blockchain module exists |
| `contractAddress` | `String` | nullable until blockchain module exists |
| `status` | `CertificateStatus` enum | `@Enumerated(EnumType.STRING)`, not null, default `ACTIVE` |
| `supersedesCertificateId` | `String` | nullable. Set when this certificate was created to replace an older one (see "Replacing a certificate" below) |
| `supersededByCertificateId` | `String` | nullable. Set on an old certificate once a newer one has replaced it |
| `createdAt` | `Instant` | not null, set at creation, not updatable |

Use Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor` like the existing `User`/`Student` entities, for consistency.

## 2. Enum — `entity/CertificateStatus.java`
```java
package com.certichain.entity;

public enum CertificateStatus {
    ACTIVE,
    REVOKED
}
```

## 3. Repository — `repository/CertificateRepository.java`
Extend `JpaRepository<Certificate, Long>`:
- `Optional<Certificate> findByCertificateId(String certificateId)`
- `boolean existsByCertificateId(String certificateId)`
- `List<Certificate> findByStudentId(Long studentId)`

## 4. New shared service — `service/HashingService.java`
```java
@Service
public class HashingService {
    public String sha256Hex(byte[] data) {
        // use java.security.MessageDigest, algorithm "SHA-256"
        // convert the resulting bytes to a lowercase hex string
    }

    public String sha256Hex(MultipartFile file) {
        // read file.getBytes() and delegate to sha256Hex(byte[])
        // wrap IOException in ApiException(HttpStatus.BAD_REQUEST, "Could not read uploaded file")
    }
}
```

## 5. New shared service — `service/FileStorageService.java`
Store files under a configurable local directory.

Add to `application.properties`:
```properties
certichain.storage.location=./uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

```java
@Service
public class FileStorageService {
    // inject certichain.storage.location via @Value, create the directory on startup if missing

    public String store(MultipartFile file, String certificateId) {
        // validate: file must not be empty -> ApiException(BAD_REQUEST, "File is required")
        // validate: content type must be "application/pdf" -> ApiException(BAD_REQUEST, "Only PDF files are accepted")
        // save as {storageLocation}/{certificateId}.pdf
        // return the stored file's path/URL string, e.g. "/files/CERT-2026-000123.pdf"
    }

    public byte[] loadAsBytes(String certificateId) {
        // read {storageLocation}/{certificateId}.pdf
        // if missing -> ApiException(HttpStatus.NOT_FOUND, "Certificate file not found")
    }

    public void delete(String certificateId) {
        // delete the file if it exists; ignore if already gone
    }
}
```

## 6. DTOs — in `dto/`

Certificate creation is a **multipart/form-data** request now, not a plain JSON body — so the request "DTO" is just a plain class/record for the non-file fields, bound via `@RequestParam` or `@ModelAttribute` in the controller (see Section 8), with the file handled as a separate `MultipartFile` parameter.

### `CertificateResponse.java` (record)
```java
public record CertificateResponse(
    Long id,
    String certificateId,
    Long studentId,
    String studentName,
    String rollNumber,
    String courseName,
    LocalDate issueDate,
    String documentUrl,
    String documentHash,
    String blockchainTxHash,
    String blockchainNetwork,
    String contractAddress,
    String status,
    String supersedesCertificateId,
    String supersededByCertificateId
) {
    // static factory from(Certificate certificate), same pattern as StudentResponse.from(...)
}
```

### `RevokeCertificateResponse.java` (record) — unchanged
```java
public record RevokeCertificateResponse(String certificateId, String status) {}
```

## 7. Service — `service/CertificateService.java`

Constructor-inject: `CertificateRepository`, `StudentRepository`, `HashingService`, `FileStorageService`.

### Certificate ID generation
Same as before: `CERT-{year}-{6-digit zero-padded sequential number}`. Retry on collision.

### `createCertificate(Long studentId, String courseName, LocalDate issueDate, MultipartFile file)` -> `CertificateResponse`
1. Look up the `Student` by `studentId`; 404 via `ApiException` if not found.
2. Generate a unique `certificateId`.
3. Call `hashingService.sha256Hex(file)` to get the real hash of the exact uploaded bytes.
4. Call `fileStorageService.store(file, certificateId)` to persist the file and get back its `documentUrl`.
5. **Blockchain registration is not built yet.** Set:
   ```java
   String blockchainTxHash = "PENDING_BLOCKCHAIN_INTEGRATION";
   String blockchainNetwork = "not-yet-integrated";
   String contractAddress = "not-yet-integrated";
   ```
   with a `// TODO:` comment noting this should call `BlockchainService.registerCertificateHash(certificateId, documentHash)` once that module exists — same integration seam as before, don't build it here.
6. Save and return the new `Certificate` as `CertificateResponse`.

### `listAll()`, `getByCertificateId(String)`, `getByStudentProfileId(Long)` — unchanged behavior from the original spec (list/lookup, 404 on missing).

### `getFileBytes(String certificateId)` -> `byte[]`
Looks up the certificate (404 if missing), then returns `fileStorageService.loadAsBytes(certificateId)`. Used by the file-download endpoint.

### `replaceCertificate(String oldCertificateId, String courseName, LocalDate issueDate, MultipartFile newFile)` -> `CertificateResponse`
**"Changing" a certificate never edits it in place** — the whole point of recording a hash on an immutable blockchain is that a past record can't be silently altered. Instead, replacing means: revoke the old one and issue a brand new certificate that's explicitly linked to it.
1. Find the old certificate by `oldCertificateId` (404 if missing).
2. If already `REVOKED`, throw `ApiException(HttpStatus.CONFLICT, "Cannot replace a certificate that is already revoked")`.
3. Create a new certificate the same way `createCertificate` does (same student as the old one, new file, new hash, new blockchain stub), but additionally set `supersedesCertificateId = oldCertificateId` on the new record.
4. Set the old certificate's `status = REVOKED` and `supersededByCertificateId = <new certificateId>`, save it.
5. Add a `// TODO:` comment noting the old certificate's on-chain record should also be revoked via `BlockchainService.revokeCertificate(...)` once that module exists.
6. Return the **new** certificate's `CertificateResponse`.

### `revoke(String certificateId)` -> `RevokeCertificateResponse` — unchanged from the original spec (404 if missing, 409 if already revoked, else set `REVOKED`).

### `deleteCertificate(String certificateId)`
Admin-only hard delete for correcting mistakes (e.g. wrong file uploaded by accident). Deletes the DB row and the stored file via `fileStorageService.delete(certificateId)`.

**Add a clear code comment**: this does NOT and CANNOT remove anything already registered on the blockchain (nothing can — that's the point of a blockchain). Deleting here only removes CertiChain's own copy/metadata; if a hash was already registered on-chain before deletion, that on-chain record persists forever. This is expected and fine — it's only a problem if someone deletes a certificate that a viewer has already been given the ID for, since verifying it afterward would then return NOT_FOUND against your database even though the chain still has the hash. Mention this trade-off, don't try to solve it — revoke, not delete, is the recommended way to invalidate a mistakenly issued certificate; delete is for a genuine "created this by accident, nobody has the ID yet" case.

All methods that write data (`createCertificate`, `replaceCertificate`, `revoke`, `deleteCertificate`) should be `@Transactional`.

## 8. Controller — `controller/CertificateController.java`

`@RestController @RequestMapping("/api/certificates") @RequiredArgsConstructor`

| Method | Path | Access | Notes |
|---|---|---|---|
| `POST` | `/api/certificates` | `@PreAuthorize("hasRole('ADMIN')")` | `multipart/form-data`. Bind `studentId` (Long), `courseName` (String), `issueDate` (LocalDate) as `@RequestParam`, and the file as `@RequestParam("file") MultipartFile file`. Returns 201 + `CertificateResponse`. |
| `GET` | `/api/certificates` | `@PreAuthorize("hasRole('ADMIN')")` | 200 + `List<CertificateResponse>` |
| `GET` | `/api/certificates/{certificateId}` | any authenticated user | 200 + `CertificateResponse` (metadata only, not the file) |
| `GET` | `/api/certificates/{certificateId}/file` | any authenticated user, but the service layer should only allow it for an ADMIN or the STUDENT who owns that certificate — check `user.getRole()` and, if `STUDENT`, that the certificate's `student.user.id` matches `user.getId()`, else throw `ApiException(HttpStatus.FORBIDDEN, "You do not have access to this file")` | Stream back the raw PDF bytes with `Content-Type: application/pdf` (use `ResponseEntity<byte[]>` with the appropriate header, or `ByteArrayResource`). This is a private download, separate from public verification. |
| `GET` | `/api/certificates/my` | any authenticated user | resolve the caller's `Student` profile via `StudentRepository.findByUserId(user.getId())`, then list their certificates. Read-only — students never get create/update/delete access here or anywhere else in this controller. |
| `PUT` | `/api/certificates/{certificateId}` | `@PreAuthorize("hasRole('ADMIN')")` | `multipart/form-data`, same fields as create. Calls `replaceCertificate(...)`. Returns 201 (a new certificate resource is what's actually returned) + the new `CertificateResponse`. |
| `DELETE` | `/api/certificates/{certificateId}` | `@PreAuthorize("hasRole('ADMIN')")` | Calls `deleteCertificate(...)`. Returns 204. |
| `PATCH` | `/api/certificates/{certificateId}/revoke` | `@PreAuthorize("hasRole('ADMIN')")` | unchanged — 200 + `RevokeCertificateResponse` |

## 9. Manual test checklist

1. ADMIN uploads a real PDF via `POST /api/certificates` with a valid `studentId` → 201, response includes a real-looking SHA-256 `documentHash` and a `certificateId` like `CERT-2026-000001`.
2. Upload a non-PDF file (e.g. a `.jpg`) → expect 400.
3. `GET /api/certificates/{certificateId}/file` as the owning STUDENT → 200, bytes match what was uploaded.
4. `GET /api/certificates/{certificateId}/file` as a **different** STUDENT (not the owner) → 403.
5. ADMIN calls `PUT /api/certificates/{certificateId}` with a new file → 201 with a new `certificateId`; the old certificate's status is now `REVOKED` and its `supersededByCertificateId` points to the new one; the new certificate's `supersedesCertificateId` points back to the old one.
6. ADMIN calls `DELETE` on a certificate → 204, and a subsequent `GET` on that `certificateId` returns 404.
7. STUDENT attempts `POST`, `PUT`, or `DELETE` on any certificate route → expect 403 (blocked by `@PreAuthorize`).
