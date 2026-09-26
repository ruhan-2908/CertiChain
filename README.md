# CertiChain — Blockchain-Based Certificate Verification System

A platform where an institution issues certificates, generates a SHA-256
fingerprint of each one, records that fingerprint on a blockchain, and lets
anyone verify whether a certificate is **AUTHENTIC**, **REVOKED**, or
**NOT FOUND** — without needing to trust a central server.


## 1. How the system works (read this first)

### Issuing a certificate
```
Admin logs in
  -> enters student + certificate details (course name, issue date)
  -> Admin uploads the certificate PDF (already issued by the institution)
  -> Backend computes SHA-256 hash of the uploaded file
  -> Backend stores the file
  -> Backend calls the smart contract: registerCertificate(certId, hash, issuer)
  -> Blockchain returns a transaction hash
  -> Backend saves certificate metadata + tx hash in PostgreSQL
  -> Certificate is now issued
```

### Verifying a certificate
```
Anyone (no login required) uploads the certificate PDF file
  -> Backend computes its SHA-256 hash
  -> Backend checks whether that exact hash is on record
  -> Result: AUTHENTIC (found, active) / REVOKED (found, revoked) / NOT_FOUND (no match)
```

(No Certificate ID entry, no QR scanning — upload is the only path in.)

The key idea: **PostgreSQL stores application data** (users, metadata, logs),
**file storage stores the actual PDFs**, and **the blockchain only stores the
tamper-evident hash + status**. The PDF itself is never put on-chain.


## 2. Tech stack by layer

| Layer | Tech | Owner |
|---|---|---|
| Frontend | React + TypeScript + Vite, Tailwind CSS + shadcn/ui | Frontend |
| Backend API | Java 17 + Spring Boot 3 | Backend |
| Auth | Spring Security + JWT | Backend |
| Database | PostgreSQL + JPA/Hibernate | Backend |
| Hashing | SHA-256 (built into Java, `MessageDigest`) | Backend |
| File handling | Multipart file upload/storage (Spring's built-in `MultipartFile`) | Backend |
| Smart Contract | Solidity | Blockchain |
| Contract Testing/Deploy | Hardhat, local EVM or public testnet (e.g. Sepolia) | Blockchain |
| Backend <-> Contract bridge | Web3j | Blockchain |
| Build | Maven (backend), npm/Vite (frontend), npm/Hardhat (contracts) | everyone |
| Version control | Git + GitHub, one monorepo, one folder per part | everyone |

Everything above is free/open-source — no paid infra needed for the whole
build. Use a local EVM (Hardhat network) or a free testnet, never mainnet.

---

## 3. Who's doing what

### Backend — Person A (project owner / integration point)
- Auth & Authorization module (**done** — see `backend/certichain-backend`)
- User & Student Management (entities + relationships + CRUD)
- Certificate Management module: admin uploads an existing certificate PDF
  + metadata (no generation), backend hashes and stores the exact uploaded
  file, tracks status/revocation, and supports "replacing" a certificate by
  revoking the old one and linking a new one (never silently editing a past
  record). Students have read-only access to their own certificates.
- Database schema design (`users`, `students`, `certificates`,
  `verification_logs` — see `docs/api-contract.md` for exact fields)
- Owns integration: wiring Blockchain Person B's `BlockchainService` and
  Backend Person B's verification service into one working flow

### Backend — Person B
- Verification Service reuses the existing HashingService and
  FileStorageService from the Certificate module — don't reimplement
  hashing or file access.
- Verification Service: hashes the uploaded file, looks up the matching
  certificate, checks revocation status, and returns AUTHENTIC/REVOKED/
  NOT_FOUND

> Backend A and B should agree on the `Certificate` entity shape on day 1 so
> B isn't blocked waiting for A's schema.

### Frontend — 1 person
- Admin dashboard: login, issue new certificate (form), view/revoke existing
  certificates, view audit/verification logs
- Student view: see their own issued certificates, download PDF
- Public verification page (no login): upload a PDF and show the
  AUTHENTIC/REVOKED/NOT FOUND result clearly
- Build against `docs/api-contract.md` — don't wait for backend to be 100%
  finished, the contract is the source of truth for request/response shapes

### Blockchain — Person A (smart contract)
- Write the Solidity contract: a registry keyed by Certificate ID, each
  record storing `hash`, `issuer`, `issueTimestamp`, `revoked`
- Functions: `registerCertificate()`, `verifyCertificate()`,
  `revokeCertificate()` — only authorized issuer addresses can
  register/revoke
- Write tests (Hardhat) and deploy to a local EVM network first, then a
  public testnet once stable
- **Priority: get a rough contract + ABI committed by day 2**, even
  unfinished — Blockchain Person B can't start integration without it

### Blockchain — Person B (Spring Boot <-> contract bridge)
- Set up Web3j in the Spring Boot project
- Build `BlockchainService`: methods that call the deployed contract
  (register/verify/revoke), sign and send transactions, read back on-chain
  state and events
- Handle failure cases: pending transactions, failed transactions, network
  errors — these need to surface as clean errors to Backend Person A's
  Verification Service, not raw Web3j exceptions
- Works closely with Backend Person A to plug this into the real flow

---

## 5. Getting started (everyone)

1. Clone the repo.
2. Go to your folder (`backend/`, `frontend/`, or `blockchain/`) and read the
   README inside it.
3. Check `docs/api-contract.md` for the exact API shapes your part needs to
   produce or consume.