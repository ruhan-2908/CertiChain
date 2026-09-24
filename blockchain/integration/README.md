# CertiChain — Blockchain Integration (Blockchain Person B)

Stack: **Web3j**, inside the Spring Boot backend project
(`backend/certichain-backend`).

This is the bridge between the Solidity contract (Blockchain Person A) and
the Spring Boot backend (Backend Person A/B). You'll mostly be working
*inside* the backend project, in a new `service/BlockchainService.java` (or
similar) plus a `config/Web3jConfig.java`.

## You are blocked until Blockchain Person A gives you:
1. The compiled contract's **ABI** (JSON file in their `artifacts/` folder)
2. The **deployed contract address** on their local Hardhat node (or testnet)

Ask for these on day 1–2 — don't wait for a "finished" contract, a rough
compiled version is enough to start generating a Java wrapper.

## Setup

Add Web3j to `backend/certichain-backend/pom.xml`:
```xml
<dependency>
    <groupId>org.web3j</groupId>
    <artifactId>core</artifactId>
    <version>4.10.3</version>
</dependency>
```

Generate a Java wrapper class from the contract's ABI using the Web3j CLI or
the Web3j Maven/Gradle plugin — this gives you a typed Java class
(`CertiChain.java`) with methods matching the Solidity functions, so you
don't hand-write raw contract calls.

## What to build

### `Web3jConfig.java`
- A `Web3j` bean pointing at the RPC URL (local Hardhat node:
  `http://127.0.0.1:8545`, or the testnet RPC URL later)
- Credentials/wallet setup for whichever account will send transactions
  (the "issuer" account — coordinate with Blockchain Person A on which
  address is authorized in the contract)

### `BlockchainService.java`
Methods that Backend Person A's Certificate/Verification services will call:
- `registerCertificateHash(certId, hash)` — sends a transaction calling
  `registerCertificate`, returns the transaction hash
- `getCertificateRecord(certId)` — read-only call to `verifyCertificate`,
  returns hash/issuer/timestamp/revoked (or "not found")
- `revokeCertificate(certId)` — sends a transaction calling
  `revokeCertificate`

### Error handling (important — don't skip this)
Web3j throws its own exceptions for things like: transaction reverted,
insufficient gas, network unreachable, nonce issues. Catch these and
translate them into clean exceptions the rest of the backend can handle
(e.g. throw the existing `ApiException` from
`com.certichain.exception.ApiException` with an appropriate message/status)
rather than letting raw Web3j stack traces leak out through the API.

## Coordinate closely with Backend Person A

Your `BlockchainService` is a dependency their `VerificationService` and
`CertificateService` will call directly. Agree on the exact method
signatures early so you can both build against an interface even before
either side is fully implemented.
