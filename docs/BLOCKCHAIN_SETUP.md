\# CertiChain — Blockchain Setup



\## 1. Overview



CertiChain uses a Solidity smart contract to store certificate fingerprints on the Ethereum Sepolia test network.



The blockchain does not store the certificate PDF itself.



Instead:



1\. The backend receives the certificate PDF.

2\. A SHA-256 hash is generated from the PDF.

3\. The certificate ID is converted to a bytes32 value.

4\. The SHA-256 hash is converted to bytes32.

5\. The backend uses Web3j to call the Solidity smart contract.

6\. The smart contract stores the certificate hash, issuer, issue timestamp, and revocation status.

7\. During verification, the uploaded PDF is hashed again and compared with the blockchain record.



\---



\## 2. Smart Contract



Contract:



`CertificateRegistry.sol`



The contract provides:



\* Issuer authorization

\* Certificate registration

\* Certificate verification

\* Certificate revocation

\* Duplicate certificate protection

\* Input validation



Main functions:



```text

addIssuer()

removeIssuer()

registerCertificate()

verifyCertificate()

revokeCertificate()

```



\---



\## 3. Blockchain Network



Network:



```text

Ethereum Sepolia Testnet

```



Chain ID:



```text

11155111

```



Contract address:



```text

0x40ae1aC261917D923b35503bea0A559ec6AEC6a7

```



The contract was deployed successfully and is publicly visible on Sepolia Etherscan.



\---



\## 4. Backend Blockchain Integration



The Spring Boot backend communicates with the smart contract using Web3j.



Flow:



```text

Spring Boot

&#x20;   |

&#x20;   v

BlockchainService

&#x20;   |

&#x20;   v

Web3j

&#x20;   |

&#x20;   v

Alchemy Sepolia RPC

&#x20;   |

&#x20;   v

Ethereum Sepolia

&#x20;   |

&#x20;   v

CertificateRegistry

```



The blockchain private key and RPC URL are kept outside the Git repository using environment/local configuration.



\---



\## 5. Certificate Registration



When a certificate is issued:



```text

Certificate PDF

&#x20;     |

&#x20;     v

SHA-256

&#x20;     |

&#x20;     v

Document Hash

&#x20;     |

&#x20;     v

Web3j

&#x20;     |

&#x20;     v

registerCertificate()

&#x20;     |

&#x20;     v

Ethereum Sepolia

```



A successful registration transaction was verified on Sepolia.



Transaction hash:



```text

0x5ec98b52914da5df38e53ace46a4943bde13b2a3480c986fbd82a6d6308eb5b9

```



Etherscan reported the transaction as successful.



\---



\## 6. On-Chain Certificate Verification



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



\---



\## 7. Certificate Verification Results



The verification API was tested with different inputs.



\### Revoked Certificate



The original PDF for `CERT-2026-000002` returned:



```text

REVOKED

```



\### Tampered Certificate



A modified copy of the PDF returned:



```text

TAMPERED

```



The modification changed the SHA-256 hash, causing it to differ from the blockchain-stored fingerprint.



\### Unknown Certificate



An unknown certificate ID returned:



```text

NOT\_FOUND

```



\---



\## 8. Hardhat Testing



The smart contract was tested using Hardhat.



Final result:



```text

16 passing

```



Tests covered:



\* Contract ownership

\* Issuer authorization

\* Adding issuers

\* Removing issuers

\* Unauthorized issuer management

\* Certificate registration

\* Duplicate certificate IDs

\* Unauthorized registration

\* Invalid certificate IDs

\* Invalid certificate hashes

\* Certificate verification

\* Unknown certificates

\* Certificate revocation

\* Double revocation

\* Unauthorized revocation



\---



\## 9. Security



The following sensitive values must never be committed to Git:



\* Blockchain private key

\* RPC API key

\* JWT secret

\* Authentication tokens



The actual Spring Boot `application.properties` file is ignored by Git.



The project repository contains only the example configuration:



```text

backend/src/main/resources/application.properties.example

```



\---



\## 10. Important Design Principle



Certificate PDFs are not stored on the blockchain.



Only the cryptographic fingerprint and required certificate metadata are stored on-chain.



Therefore:



```text

PDF → SHA-256 → Blockchain

```



rather than:



```text

PDF → Blockchain

```



This keeps the blockchain data small while allowing later verification of whether a certificate file has been modified.



\---



\## 11. Current Status



Blockchain implementation:



```text

COMPLETE

```



Sepolia deployment:



```text

COMPLETE

```



Spring Boot + Web3j integration:



```text

COMPLETE

```



Smart contract tests:



```text

16 PASSING

```



Git working tree:



```text

CLEAN

```



