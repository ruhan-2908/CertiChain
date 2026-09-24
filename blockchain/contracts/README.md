# CertiChain — Smart Contract (Blockchain Person A)

Stack: **Solidity**, tested/deployed with **Hardhat**, on a local EVM network
first, then a free public testnet (e.g. Sepolia) if time allows.

## Setup

```bash
npm install --save-dev hardhat
npx hardhat init      # choose "Create a JavaScript project"
npx hardhat node      # runs a local EVM at http://127.0.0.1:8545
```

## What to build

A registry contract keyed by Certificate ID. Put it at
`blockchain/contracts/contracts/CertiChain.sol`.

### Data to store per certificate
- `hash` — the SHA-256 fingerprint (as bytes32 or string)
- `issuer` — address that registered it
- `issueTimestamp`
- `revoked` — bool

### Functions needed
- `registerCertificate(certId, hash)` — only callable by an authorized
  issuer address; reverts if the certId already exists
- `verifyCertificate(certId)` — public, read-only, returns the stored hash +
  issuer + timestamp + revoked status (or indicates "not found")
- `revokeCertificate(certId)` — only callable by an authorized issuer

### Access control
Only authorized issuer addresses can register or revoke. Simplest approach
for a college project: an `onlyOwner`-style modifier, or a mapping of
approved issuer addresses set in the constructor / by the owner.


## Testing

Write Hardhat tests (`test/CertiChain.js` or `.ts`) covering:
- Registering a certificate and reading it back
- Registering a duplicate certId (should fail)
- Revoking and confirming `verifyCertificate` reflects it
- A non-authorized address trying to register/revoke (should fail)

```bash
npx hardhat test
```

## Deploying

Deploy to your local Hardhat node first so Blockchain Person B can integrate
against something real:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Share the deployed contract address + ABI file (in `artifacts/`) with
Blockchain Person B and Backend Person A — they both need it.
