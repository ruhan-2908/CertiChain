# CertiChain — Blockchain Setup and API Testing

## 1. Overview

CertiChain uses a Solidity smart contract to store certificate fingerprints on the Ethereum Sepolia test network.

The blockchain does not store the certificate PDF itself.

Instead:

1. The backend receives the certificate PDF.
2. A SHA-256 hash is generated from the PDF.
3. The certificate ID is converted to a bytes32 value.
4. The SHA-256 hash is converted to bytes32.
5. The backend uses Web3j to call the Solidity smart contract.
6. The smart contract stores the certificate hash, issuer, issue timestamp, and revocation status.
7. During verification, the uploaded PDF is hashed again and compared with the blockchain record.

---

# 2. Smart Contract

Contract:

```text
CertificateRegistry.sol
```

The contract provides:

* Issuer authorization
* Certificate registration
* Certificate verification
* Certificate revocation
* Duplicate certificate protection
* Input validation

Main functions:

```text
addIssuer()
removeIssuer()
registerCertificate()
verifyCertificate()
revokeCertificate()
```

---

# 3. Blockchain Network

Network:

```text
Ethereum Sepolia Testnet
```

Chain ID:

```text
11155111
```

Current deployed contract:

```text
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

The contract was deployed successfully and is publicly available on the Sepolia blockchain.

---

# 4. Backend Blockchain Integration

The Spring Boot backend communicates with the smart contract using Web3j.

Architecture:

```text
Spring Boot
    |
    v
BlockchainService
    |
    v
Web3j
    |
    v
Sepolia RPC
    |
    v
Ethereum Sepolia
    |
    v
CertificateRegistry
```

The blockchain private key and RPC credentials are kept outside the Git repository using environment/local configuration.

---

# 5. Certificate Registration

When a certificate is issued:

```text
Certificate PDF
      |
      v
SHA-256
      |
      v
Document Hash
      |
      v
Web3j
      |
      v
registerCertificate()
      |
      v
Ethereum Sepolia
```

A successful registration transaction was verified on Sepolia.

Transaction hash:

```text
0x5ec98b52914da5df38e53ace46a4943bde13b2a3480c986fbd82a6d6308eb5b9
```

The transaction was confirmed successfully on the Ethereum Sepolia testnet.

---

# 6. On-Chain Certificate Verification

The certificate:

```text
CERT-2026-000002
```

was queried directly from the deployed smart contract.

The contract returned:

```text
Exists: true

Certificate Hash:
0x71cd303b898c99600c047c9e96a98b4f4a57bd604efeae308c13ded4c0f93dfd

Issuer:
0xDB740A0ed795E89d4A6594a4A88CC390449d251e

Revoked:
true
```

The stored blockchain hash matches the SHA-256 hash stored by the backend.

---

# 7. Certificate Verification Results

The verification API was tested with different inputs.

### Revoked Certificate

The original PDF for:

```text
CERT-2026-000002
```

returned:

```text
REVOKED
```

The PDF hash matched the registered blockchain hash, but the certificate had been revoked.

### Tampered Certificate

A modified copy of the PDF returned:

```text
TAMPERED
```

The modification changed the SHA-256 hash, causing it to differ from the blockchain-stored fingerprint.

### Unknown Certificate

An unknown certificate ID returned:

```text
NOT_FOUND
```

---

# 8. Postman API Testing

Postman was used to test the Spring Boot REST APIs and verify the complete certificate workflow.

## 8.1 Admin Login

Endpoint:

```text
POST /api/auth/login
```

Request body:

```json
{
  "email": "<ADMIN_EMAIL>",
  "password": "<ADMIN_PASSWORD>"
}
```

The API returns a JWT token.

The token is used in the `Authorization` header for protected endpoints:

```text
Authorization: Bearer <JWT_TOKEN>
```

> Test credentials should be configured locally and should not be committed to the repository.

---

## 8.2 Get Certificate

Endpoint:

```text
GET /api/certificates/{certificateId}
```

Example:

```text
GET /api/certificates/CERT-2026-000002
```

The API returns certificate metadata including:

* Certificate ID
* Student details
* Course name
* Issue date
* SHA-256 document hash
* Blockchain transaction hash
* Blockchain network
* Contract address
* Certificate status

---

## 8.3 Create Certificate

Endpoint:

```text
POST /api/certificates
```

The request uses `multipart/form-data`.

Parameters:

```text
studentId
courseName
issueDate
file
```

Example:

```text
studentId = 1
courseName = Machine Learning
issueDate = 2026-10-01
file = test-certificate.pdf
```

The backend:

1. Receives the PDF.
2. Generates the SHA-256 hash.
3. Generates a certificate ID.
4. Sends the certificate hash to the Sepolia smart contract.
5. Receives the blockchain transaction hash.
6. Stores certificate metadata in PostgreSQL.

---

## 8.4 Verify Certificate

Endpoint:

```text
POST /api/verify/upload
```

The request uses:

```text
multipart/form-data
```

Parameters:

```text
file
certificateId
```

The uploaded PDF is hashed and compared against the certificate hash stored on the blockchain.

The API can return:

```text
AUTHENTIC
TAMPERED
REVOKED
NOT_FOUND
```

---

## 8.5 Revocation

Endpoint:

```text
PATCH /api/certificates/{certificateId}/revoke
```

Example:

```text
PATCH /api/certificates/CERT-2026-000002/revoke
```

The backend sends a `revokeCertificate()` transaction to the Solidity contract.

After successful blockchain confirmation, the certificate status is updated in PostgreSQL.

---

## 8.6 Postman Verification Results

The following scenarios were tested successfully.

| Test                      | Input                         | Result                            |
| ------------------------- | ----------------------------- | --------------------------------- |
| Admin login               | Valid admin credentials       | Successful                        |
| Get certificate           | `CERT-2026-000002`            | Successful                        |
| Certificate registration  | PDF upload                    | Blockchain transaction successful |
| Original PDF verification | Original PDF + certificate ID | `REVOKED`                         |
| Tampered PDF verification | Modified PDF + certificate ID | `TAMPERED`                        |
| Unknown certificate       | Unknown certificate ID        | `NOT_FOUND`                       |
| Certificate revocation    | `CERT-2026-000002`            | Successful                        |

The original PDF produced `REVOKED` because the certificate had subsequently been revoked. The hash itself matched the blockchain record.

The modified PDF produced `TAMPERED` because its SHA-256 hash no longer matched the hash stored on-chain.

---

## 8.7 Blockchain Transaction Evidence

The successful certificate registration transaction tested through the backend was:

```text
0x5ec98b52914da5df38e53ace46a4943bde13b2a3480c986fbd82a6d6308eb5b9
```

The transaction was confirmed successfully on the Ethereum Sepolia testnet.

The deployed contract is:

```text
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

This confirms that the Postman API request successfully triggered the backend-to-blockchain integration.

---

# 9. Hardhat Testing

The smart contract was tested using Hardhat.

Final result:

```text
16 passing
```

Tests covered:

* Contract ownership
* Issuer authorization
* Adding issuers
* Removing issuers
* Unauthorized issuer management
* Certificate registration
* Duplicate certificate IDs
* Unauthorized registration
* Invalid certificate IDs
* Invalid certificate hashes
* Certificate verification
* Unknown certificates
* Certificate revocation
* Double revocation
* Unauthorized revocation

---

# 10. Local Blockchain Setup

CertiChain includes a local Hardhat setup for development and testing.

Run:

```powershell
npm run setup:local
```

The setup script:

1. Starts a local Hardhat node.
2. Deploys `CertificateRegistry`.
3. Configures the local issuer.
4. Generates local deployment information.
5. Generates local ABI information.
6. Generates backend configuration information.

The local blockchain is intended for development and testing.

Local blockchain state is temporary and can change when the local node is restarted.

---

# 11. Sepolia Deployment

The current deployed contract is:

```text
Network:
Ethereum Sepolia

Chain ID:
11155111

Contract:
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

The deployment was performed using Hardhat.

Sepolia deployment requires:

```text
SEPOLIA_RPC_URL
SEPOLIA_PRIVATE_KEY
```

Private keys must never be committed to GitHub.

---

# 12. Security

The following sensitive values must never be committed to Git:

* Blockchain private key
* RPC API key
* JWT secret
* Authentication tokens
* Database passwords
* Secret Recovery Phrase

The actual Spring Boot `application.properties` file is ignored by Git.

The repository contains only the example configuration:

```text
backend/src/main/resources/application.properties.example
```

Public blockchain information such as:

* Contract addresses
* Transaction hashes
* Certificate SHA-256 fingerprints
* Sepolia chain ID

can be documented because these values do not provide control over the wallet.

---

# 13. Important Design Principle

Certificate PDFs are not stored on the blockchain.

Only the cryptographic fingerprint and required certificate metadata are stored on-chain.

Therefore:

```text
PDF
 |
 v
SHA-256
 |
 v
Blockchain
```

rather than:

```text
PDF
 |
 v
Blockchain
```

This keeps blockchain storage small while allowing later verification of whether a certificate file has been modified.

---

# 14. End-to-End System Flow

The complete certificate workflow is:

```text
Admin
  |
  v
Spring Boot Backend
  |
  +---- Generate Certificate ID
  |
  +---- Generate/Store PDF
  |
  +---- Calculate SHA-256
  |
  v
Web3j
  |
  v
CertificateRegistry
  |
  v
Ethereum Sepolia
  |
  +---- Store Certificate Hash
  +---- Store Issuer
  +---- Store Timestamp
  +---- Store Revocation Status
```

Verification:

```text
User Uploads PDF
       |
       v
Calculate SHA-256
       |
       v
Find Certificate ID
       |
       v
Read Blockchain Record
       |
       v
Compare Hashes
       |
       +---- Different ----> TAMPERED
       |
       +---- Certificate Missing ----> NOT_FOUND
       |
       +---- Same
              |
              v
        Check Revocation
              |
              +---- Revoked ----> REVOKED
              |
              +---- Active ----> AUTHENTIC
```

---

# 15. Current Project Status

| Component                          | Status     |
| ---------------------------------- | ---------- |
| Solidity smart contract            | Complete   |
| Hardhat configuration              | Complete   |
| Hardhat tests                      | 16 passing |
| Local deployment                   | Tested     |
| Sepolia deployment                 | Successful |
| Web3j integration                  | Tested     |
| Certificate registration           | Tested     |
| Blockchain verification            | Tested     |
| Certificate revocation             | Tested     |
| Tamper detection                   | Tested     |
| NOT_FOUND verification             | Tested     |
| Postman API testing                | Completed  |
| Etherscan transaction verification | Completed  |
| Blockchain documentation           | Complete   |
| Git repository                     | Clean      |

The blockchain implementation uses Ethereum Sepolia testnet and does not require real cryptocurrency for normal development and testing.
