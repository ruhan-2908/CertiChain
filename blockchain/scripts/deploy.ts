import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying CertificateRegistry...");
  console.log("Deployer address:", deployer.address);

  const CertificateRegistry = await ethers.getContractFactory(
    "CertificateRegistry"
  );

  const registry = await CertificateRegistry.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log("CertificateRegistry deployed to:", contractAddress);
  console.log(
    "Deployer authorized:",
    await registry.authorizedIssuers(deployer.address)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});