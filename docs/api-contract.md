# CertiChain — API Contract

Base URL (local dev): `http://localhost:8080`

All request/response bodies are JSON. Protected routes need header:
`Authorization: Bearer <token>`

Status codes follow normal REST conventions (200/201 success, 400 validation
error, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict).

---

## Auth — already built, live now

### `POST /api/auth/register`
Public.
```json
// Request
{
  "fullName": "Jane Student",
  "email": "jane@college.edu",
  "password": "StudentPass123",
  "role": "STUDENT"   // or "ADMIN"
}
```
```json
// Response 201
{
  "token": "...",
  "tokenType": "Bearer",
  "userId": 2,
  "fullName": "Jane Student",
  "email": "jane@college.edu",
  "role": "STUDENT"
}
```

### `POST /api/auth/login`
Public.
```json
// Request
{ "email": "jane@college.edu", "password": "StudentPass123" }
```
Response: same shape as register.

### `GET /api/auth/me`
Protected (any logged-in user).
```json
// Response 200
{ "id": 2, "fullName": "Jane Student", "email": "jane@college.edu", "role": "STUDENT" }
```

---

## Certificates — to be built by Backend Person A

### `POST /api/certificates`
Protected, `ADMIN` only. Issues a new certificate (runs the full flow: PDF
generation -> hash -> blockchain registration -> save metadata).
```json
// Request
{
  "studentId": 2,
  "courseName": "B.Tech Computer Science",
  "issueDate": "2026-09-24"
}
```
```json
// Response 201
{
  "certificateId": "CERT-2026-000123",
  "studentId": 2,
  "studentName": "Jane Student",
  "courseName": "B.Tech Computer Science",
  "issueDate": "2026-09-24",
  "documentUrl": "/files/CERT-2026-000123.pdf",
  "documentHash": "a1b2c3...",
  "blockchainTxHash": "0xabc123...",
  "blockchainNetwork": "localhost-hardhat",
  "contractAddress": "0x...",
  "status": "ACTIVE"
}
```

### `GET /api/certificates` — Protected, `ADMIN` only. List all issued certificates.

### `GET /api/certificates/{certificateId}` — Protected. Get one certificate's metadata.

### `GET /api/certificates/my` — Protected, `STUDENT`. List the logged-in student's own certificates.

### `PATCH /api/certificates/{certificateId}/revoke` — Protected, `ADMIN` only.
Triggers `BlockchainService.revokeCertificate()` and updates status in DB.
```json
// Response 200
{ "certificateId": "CERT-2026-000123", "status": "REVOKED" }
```

---

## Verification — to be built by Backend Person B, public (no login)

### `GET /api/verify/{certificateId}`
Public. Looks up the certificate, checks blockchain record + revocation
status. No file upload — just checks existence/revocation.
```json
// Response 200
{
  "certificateId": "CERT-2026-000123",
  "result": "AUTHENTIC",   // AUTHENTIC | REVOKED | NOT_FOUND
  "studentName": "Jane Student",
  "courseName": "B.Tech Computer Science",
  "issueDate": "2026-09-24"
}
```

### `POST /api/verify/{certificateId}/upload`
Public, `multipart/form-data` with a `file` field (the PDF to check).
Computes SHA-256 of the uploaded file and compares against the registered
hash, in addition to the checks above.
```json
// Response 200
{
  "certificateId": "CERT-2026-000123",
  "result": "TAMPERED",   // AUTHENTIC | TAMPERED | REVOKED | NOT_FOUND
  "uploadedHash": "x1y2z3...",
  "registeredHash": "a1b2c3..."
}
```

---

## BlockchainService — Java interface, not an HTTP API

This is internal to the backend (used by Backend Person A + B), built by
Blockchain Person B. Documented here so everyone knows the shape:

```java
public interface BlockchainService {
    String registerCertificateHash(String certificateId, String hash); // returns tx hash
    CertificateRecord getCertificateRecord(String certificateId);       // read-only
    void revokeCertificate(String certificateId);
}

record CertificateRecord(
    String hash,
    String issuerAddress,
    Instant issueTimestamp,
    boolean revoked,
    boolean found
) {}
```

---

## Database structure (reference)

```
users
  id, full_name, email, password, role, enabled, created_at

students
  id, user_id (FK -> users), <any student-specific fields>

certificates
  id, certificate_id (unique, e.g. CERT-2026-000123), student_id (FK),
  course_name, issue_date, document_url, document_hash,
  blockchain_tx_hash, blockchain_network, contract_address, status

verification_logs
  id, certificate_id, method (ID_ONLY | FILE_UPLOAD), result,
  verified_at, ip_address (optional)
```

---

## Notes for everyone

- This contract may change as we build — if you need a field that isn't
  here, or want to change a shape, flag it in the group chat before just
  building against something different, so nobody's work diverges.
- Enum-like fields (`role`, `status`, `result`) use these exact string
  values shown above — match them exactly on the frontend.
