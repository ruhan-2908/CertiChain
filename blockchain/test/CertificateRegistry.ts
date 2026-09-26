import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CertificateRegistry", function () {
  async function deployContract() {
    const [owner, issuer, user] = await ethers.getSigners();

    const CertificateRegistry = await ethers.getContractFactory(
      "CertificateRegistry"
    );

    const registry = await CertificateRegistry.deploy();

    return { registry, owner, issuer, user };
  }

  describe("Deployment", function () {
    it("should set the deployer as the owner", async function () {
      const { registry, owner } = await deployContract();

      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should authorize the deployer as an issuer", async function () {
      const { registry, owner } = await deployContract();

      expect(await registry.authorizedIssuers(owner.address)).to.equal(true);
    });
  });

  describe("Issuer Management", function () {
    it("should allow the owner to add an issuer", async function () {
      const { registry, issuer } = await deployContract();

      await registry.addIssuer(issuer.address);

      expect(await registry.authorizedIssuers(issuer.address)).to.equal(true);
    });

    it("should allow the owner to remove an issuer", async function () {
      const { registry, issuer } = await deployContract();

      await registry.addIssuer(issuer.address);
      await registry.removeIssuer(issuer.address);

      expect(await registry.authorizedIssuers(issuer.address)).to.equal(false);
    });

    it("should reject issuer management by unauthorized users", async function () {
      const { registry, issuer, user } = await deployContract();

      await expect(
        registry.connect(user).addIssuer(issuer.address)
      ).to.be.revertedWithCustomError(registry, "Unauthorized");
    });
  });

  describe("Certificate Registration", function () {
    it("should register a certificate", async function () {
      const { registry, owner } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-001")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await expect(
        registry.registerCertificate(certificateId, certificateHash)
      )
        .to.emit(registry, "CertificateRegistered")
        .withArgs(
          certificateId,
          certificateHash,
          owner.address,
          (timestamp: bigint) => timestamp > 0n
        );
    });

    it("should store certificate details correctly", async function () {
      const { registry, owner } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-002")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await registry.registerCertificate(
        certificateId,
        certificateHash
      );

      const result = await registry.verifyCertificate(certificateId);

      expect(result[0]).to.equal(true);
      expect(result[1]).to.equal(certificateHash);
      expect(result[2]).to.equal(owner.address);
      expect(result[3]).to.be.greaterThan(0);
      expect(result[4]).to.equal(false);
    });

    it("should reject duplicate certificate IDs", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-003")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await registry.registerCertificate(
        certificateId,
        certificateHash
      );

      await expect(
        registry.registerCertificate(certificateId, certificateHash)
      ).to.be.revertedWithCustomError(
        registry,
        "CertificateAlreadyExists"
      );
    });

    it("should reject unauthorized registration", async function () {
      const { registry, user } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-004")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await expect(
        registry
          .connect(user)
          .registerCertificate(certificateId, certificateHash)
      ).to.be.revertedWithCustomError(
        registry,
        "Unauthorized"
      );
    });

    it("should reject an empty certificate ID", async function () {
      const { registry } = await deployContract();

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await expect(
        registry.registerCertificate(
          ethers.ZeroHash,
          certificateHash
        )
      ).to.be.revertedWithCustomError(
        registry,
        "InvalidCertificateId"
      );
    });

    it("should reject an empty certificate hash", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-005")
      );

      await expect(
        registry.registerCertificate(
          certificateId,
          ethers.ZeroHash
        )
      ).to.be.revertedWithCustomError(
        registry,
        "InvalidCertificateHash"
      );
    });
  });

  describe("Certificate Verification", function () {
    it("should return not found for an unknown certificate", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("UNKNOWN")
      );

      const result = await registry.verifyCertificate(certificateId);

      expect(result[0]).to.equal(false);
      expect(result[1]).to.equal(ethers.ZeroHash);
      expect(result[2]).to.equal(ethers.ZeroAddress);
      expect(result[3]).to.equal(0);
      expect(result[4]).to.equal(false);
    });
  });

  describe("Certificate Revocation", function () {
    it("should revoke a registered certificate", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-006")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await registry.registerCertificate(
        certificateId,
        certificateHash
      );

      await expect(
        registry.revokeCertificate(certificateId)
      ).to.emit(registry, "CertificateRevoked");

      const result = await registry.verifyCertificate(certificateId);

      expect(result[0]).to.equal(true);
      expect(result[4]).to.equal(true);
    });

    it("should reject revocation of an unknown certificate", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("UNKNOWN-CERT")
      );

      await expect(
        registry.revokeCertificate(certificateId)
      ).to.be.revertedWithCustomError(
        registry,
        "CertificateNotFound"
      );
    });

    it("should reject double revocation", async function () {
      const { registry } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-007")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await registry.registerCertificate(
        certificateId,
        certificateHash
      );

      await registry.revokeCertificate(certificateId);

      await expect(
        registry.revokeCertificate(certificateId)
      ).to.be.revertedWithCustomError(
        registry,
        "CertificateAlreadyRevoked"
      );
    });

    it("should reject unauthorized revocation", async function () {
      const { registry, user } = await deployContract();

      const certificateId = ethers.keccak256(
        ethers.toUtf8Bytes("CERT-008")
      );

      const certificateHash = ethers.sha256(
        ethers.toUtf8Bytes("certificate-pdf-content")
      );

      await registry.registerCertificate(
        certificateId,
        certificateHash
      );

      await expect(
        registry
          .connect(user)
          .revokeCertificate(certificateId)
      ).to.be.revertedWithCustomError(
        registry,
        "Unauthorized"
      );
    });
  });
});