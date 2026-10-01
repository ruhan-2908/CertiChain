# CertiChain — Setup and Run Guide

## 1. Project Overview

CertiChain is a blockchain-based certificate verification system.

The system uses:

* React + TypeScript + Vite for the frontend
* Spring Boot for the backend
* PostgreSQL for application data
* Solidity for the certificate registry smart contract
* Hardhat for blockchain development and testing
* Web3j for Spring Boot-to-blockchain communication
* Ethereum Sepolia Testnet for blockchain deployment

The blockchain stores certificate fingerprints rather than certificate PDF files.

---

# 2. Prerequisites

Install the following software before running the project.

### Required

* Git
* Java JDK 21
* Maven 3.9+
* Node.js
* npm
* PostgreSQL
* A code editor such as VS Code

### Blockchain requirements

For Sepolia deployment or blockchain transactions:

* A Sepolia-compatible wallet
* Sepolia test ETH
* An Ethereum Sepolia RPC endpoint

Do not use real Ethereum for this project.

---

# 3. Clone the Repository

Clone the repository:

```powershell
git clone https://github.com/ruhan-2908/CertiChain.git
cd CertiChain
```

Check the repository:

```powershell
git status
```

---

# 4. Project Structure

```text
CertiChain/
├── backend/
├── frontend/
├── blockchain/
├── docs/
├── .gitignore
└── README.md
```

---

# 5. Blockchain Setup

Go to the blockchain directory:

```powershell
cd blockchain
```

Install dependencies:

```powershell
npm install
```

Compile the smart contract:

```powershell
npx hardhat compile
```

Run the smart contract tests:

```powershell
npx hardhat test
```

The project currently contains 16 smart contract tests.

Expected result:

```text
16 passing
```

---

# 6. Local Blockchain

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
5. Generates the local ABI information.
6. Generates backend configuration information.

The local blockchain is intended for development and testing.

Local blockchain state is temporary and can change when the local node is restarted.

---

# 7. Sepolia Testnet

The deployed contract currently used by the project is:

```text
Network: Ethereum Sepolia
Chain ID: 11155111

Contract:
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

For security, private keys and RPC credentials must never be committed to GitHub.

Each developer should use their own test wallet and RPC credentials.

---

# 8. Sepolia Environment Variables

The Hardhat configuration expects:

```text
SEPOLIA_RPC_URL
SEPOLIA_PRIVATE_KEY
```

On Windows PowerShell, these can be configured as user environment variables.

Example:

```powershell
[System.Environment]::SetEnvironmentVariable(
    "SEPOLIA_RPC_URL",
    "<YOUR_SEPOLIA_RPC_URL>",
    "User"
)

[System.Environment]::SetEnvironmentVariable(
    "SEPOLIA_PRIVATE_KEY",
    "<YOUR_TEST_WALLET_PRIVATE_KEY>",
    "User"
)
```

Do not replace the placeholders with values in this documentation.

Never commit the private key or RPC credentials.

After opening a new PowerShell session, verify only that the variables exist:

```powershell
$env:SEPOLIA_RPC_URL = [System.Environment]::GetEnvironmentVariable("SEPOLIA_RPC_URL", "User")
$env:SEPOLIA_PRIVATE_KEY = [System.Environment]::GetEnvironmentVariable("SEPOLIA_PRIVATE_KEY", "User")
```

Do not print the actual private key or API key.

---

# 9. Sepolia Deployment

If a new deployment is required, configure the Sepolia environment variables first.

Then:

```powershell
cd blockchain
npx hardhat run scripts/deploy.ts --network sepolia
```

The deployment script prints the deployed contract address.

The backend must use the address of the deployed contract.

For the current project deployment:

```text
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

---

# 10. PostgreSQL Setup

Install PostgreSQL and create a database named:

```text
certichain
```

Example PostgreSQL configuration:

```text
Host: localhost
Port: 5432
Database: certichain
Username: <YOUR_POSTGRES_USERNAME>
Password: <YOUR_POSTGRES_PASSWORD>
```

The database credentials should be configured locally and should not be committed to GitHub.

---

# 11. Backend Configuration

Go to:

```text
backend/
```

Copy the example configuration:

```text
backend/src/main/resources/application.properties.example
```

to:

```text
backend/src/main/resources/application.properties
```

Configure the local values for:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/certichain
spring.datasource.username=<YOUR_POSTGRES_USERNAME>
spring.datasource.password=<YOUR_POSTGRES_PASSWORD>

certichain.blockchain.rpc-url=<YOUR_SEPOLIA_RPC_URL>
certichain.blockchain.contract-address=0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
certichain.blockchain.private-key=${SEPOLIA_PRIVATE_KEY}

certichain.security.jwt.secret=<YOUR_LOCAL_JWT_SECRET>
```

The actual `application.properties` file is ignored by Git.

---

# 12. Build the Backend

From the backend directory:

```powershell
cd backend
mvn clean compile
```

The project uses Java 21.

Check Java:

```powershell
java -version
```

Expected major version:

```text
21
```

---

# 13. Run the Backend

Start Spring Boot:

```powershell
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

The backend communicates with:

```text
Spring Boot
    ↓
Web3j
    ↓
Sepolia RPC
    ↓
CertificateRegistry
    ↓
Ethereum Sepolia
```

---

# 14. Frontend Setup

Open another terminal.

Go to:

```powershell
cd CertiChain\frontend
```

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

The Vite development server will display the local frontend URL in the terminal.

---

# 15. API Testing with Postman

Postman can be used to test the backend APIs.

The application itself does not depend on Postman.

Postman is only a testing tool.

### Admin Login

```text
POST http://localhost:8080/api/auth/login
```

Request body:

```json
{
  "email": "<ADMIN_EMAIL>",
  "password": "<ADMIN_PASSWORD>"
}
```

The response contains a JWT token.

Use the token for protected endpoints:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

# 16. Create a Certificate

Endpoint:

```text
POST http://localhost:8080/api/certificates
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
file = <certificate PDF>
```

The backend:

1. Receives the PDF.
2. Generates the certificate ID.
3. Calculates the SHA-256 hash.
4. Sends the certificate hash to the smart contract.
5. Waits for the blockchain transaction.
6. Stores certificate metadata in PostgreSQL.
7. Returns the certificate information and transaction hash.

---

# 17. Get a Certificate

Endpoint:

```text
GET http://localhost:8080/api/certificates/{certificateId}
```

Example:

```text
GET http://localhost:8080/api/certificates/CERT-2026-000002
```

The response contains certificate information including:

* Certificate ID
* Student information
* Course
* Issue date
* Document hash
* Blockchain transaction hash
* Blockchain network
* Contract address
* Status

---

# 18. Verify a Certificate

Endpoint:

```text
POST http://localhost:8080/api/verify/upload
```

Request:

```text
multipart/form-data
```

Parameters:

```text
file
certificateId
```

The backend calculates the SHA-256 hash of the uploaded file and compares it against the registered certificate hash.

Possible results:

```text
AUTHENTIC
TAMPERED
REVOKED
NOT_FOUND
```

---

# 19. Revoke a Certificate

Endpoint:

```text
PATCH http://localhost:8080/api/certificates/{certificateId}/revoke
```

Example:

```text
PATCH http://localhost:8080/api/certificates/CERT-2026-000002/revoke
```

The backend sends a `revokeCertificate()` transaction to the smart contract.

After successful blockchain confirmation, the certificate is marked as revoked in the application database.

---

# 20. Verification Flow

The complete verification process is:

```text
Upload Certificate PDF
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
        +---- Hash differs ----> TAMPERED
        |
        +---- Certificate missing ----> NOT_FOUND
        |
        +---- Hash matches
                    |
                    v
              Check status
                    |
                    +---- Revoked ----> REVOKED
                    |
                    +---- Active ----> AUTHENTIC
```

---

# 21. Blockchain Data

For the current Sepolia deployment:

```text
Network:
Ethereum Sepolia

Chain ID:
11155111

Contract:
0x40ae1aC261917D923b35503bea0A559ec6AEC6a7
```

A successful certificate registration transaction was tested:

```text
0x5ec98b52914da5df38e53ace46a4943bde13b2a3480c986fbd82a6d6308eb5b9
```

These are public blockchain identifiers.

Private keys and RPC credentials must never be included in the repository.

---

# 22. Development Tests

### Smart Contract Tests

```powershell
cd blockchain
npx hardhat test
```

Expected:

```text
16 passing
```

### Backend Build

```powershell
cd backend
mvn clean compile
```

Expected:

```text
BUILD SUCCESS
```

---

# 23. Important Security Rules

Never commit:

```text
SEPOLIA_PRIVATE_KEY
Alchemy API keys
JWT secrets
database passwords
authentication tokens
Secret Recovery Phrases
```

Do not use real funds for this project.

Use Ethereum Sepolia testnet for blockchain development and testing.

The following files are intentionally kept local:

```text
backend/src/main/resources/application.properties
```

---

# 24. Troubleshooting

### Backend cannot connect to PostgreSQL

Check:

* PostgreSQL is running.
* Database `certichain` exists.
* Username and password are correct.
* Port `5432` is available.

### Backend cannot connect to blockchain

Check:

* `SEPOLIA_RPC_URL` is configured.
* The RPC endpoint is valid.
* Internet connectivity is available.
* The configured contract address is correct.

### Blockchain transaction fails

Check:

* The wallet has Sepolia test ETH.
* The wallet private key corresponds to the configured test wallet.
* The contract address is correct.
* The wallet is an authorized issuer.

### Hardhat tests fail

Run:

```powershell
npm install
npx hardhat compile
npx hardhat test
```

If the problem continues, check the Node.js and npm versions.

---

# 25. Current Project Status

The blockchain implementation has been tested with:

```text
Smart contract tests: 16 passing
Sepolia deployment: Successful
Spring Boot + Web3j: Working
Certificate registration: Tested
Certificate verification: Tested
Certificate revocation: Tested
Tamper detection: Tested
NOT_FOUND verification: Tested
Postman API testing: Completed
Git repository: Clean
```

The project uses Ethereum Sepolia testnet and does not require real cryptocurrency for normal development/testing.
