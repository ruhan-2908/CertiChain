const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC_URL = "http://127.0.0.1:8545";
const CHAIN_ID = 31337;
const BACKEND_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044976f0945389dc9e86dae88c7a4e4d9e7e3f2a4b6b4";
const rootDir = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const artifactPath = path.join(
  rootDir,
  "artifacts",
  "contracts",
  "CertificateRegistry.sol",
  "CertificateRegistry.json"
);

const deploymentsDir = path.join(rootDir, "deployments");
const deploymentPath = path.join(deploymentsDir, "local.json");
const abiPath = path.join(deploymentsDir, "local-abi.json");
const backendEnvPath = path.join(deploymentsDir, "backend.env");

let hardhatNode;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRpc(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        return true;
      }
    } catch (_) {
      // Hardhat node is not ready yet.
    }

    process.stdout.write(".");
    await sleep(1000);
  }

  return false;
}

function cleanup() {
  if (hardhatNode && !hardhatNode.killed) {
    console.log("\nStopping local Hardhat node...");
    hardhatNode.kill("SIGINT");
  }
}

async function main() {
  console.log("==========================================");
  console.log(" CertiChain Local Blockchain Setup");
  console.log("==========================================\n");

  if (!fs.existsSync(artifactPath)) {
    console.error("CertificateRegistry artifact not found.");
    console.error("Run this first:");
    console.error("  npx hardhat compile");
    process.exit(1);
  }

  console.log("Starting local Hardhat node...");

 hardhatNode = spawn(
  process.platform === "win32" ? process.env.ComSpec : "npx",
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx hardhat node"]
    : ["hardhat", "node"],
  {
    cwd: rootDir,
    stdio: ["ignore", "ignore", "pipe"],
    shell: false,
  }
);

hardhatNode.stderr.on("data", (data) => {
  process.stderr.write(data);
});
  hardhatNode.on("error", (error) => {
    console.error("Failed to start Hardhat node:", error);
  });

  console.log(`\nWaiting for RPC at ${RPC_URL}`);

  const rpcReady = await waitForRpc();

  if (!rpcReady) {
    console.error("\nHardhat RPC did not become available.");
    cleanup();
    process.exit(1);
  }

  console.log("\nRPC is ready.");

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, {
    staticNetwork: true,
  });

  const deployer = await provider.getSigner(0);
  const backend = await provider.getSigner(1);

  const deployerAddress = await deployer.getAddress();
  const backendAddress = await backend.getAddress();

  console.log("\nLocal accounts:");
  console.log("Deployer:", deployerAddress);
  console.log("Backend :", backendAddress);

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("\nDeploying CertificateRegistry...");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer
  );

  const registry = await factory.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log("CertificateRegistry deployed to:", contractAddress);

  console.log("\nAdding backend account as authorized issuer...");

  const addIssuerTx = await registry.addIssuer(backendAddress);
  await addIssuerTx.wait();

  const backendAuthorized = await registry.authorizedIssuers(
    backendAddress
  );

  console.log("Backend authorized:", backendAuthorized);

  fs.mkdirSync(deploymentsDir, { recursive: true });

  const deploymentInfo = {
    network: "hardhat-local",
    rpcUrl: RPC_URL,
    chainId: CHAIN_ID,
    contract: "CertificateRegistry",
    address: contractAddress,
    owner: deployerAddress,
    deployer: deployerAddress,
    backendAccount: backendAddress,
    backendAuthorized: backendAuthorized,
  };

  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  fs.writeFileSync(
    abiPath,
    JSON.stringify(artifact.abi, null, 2)
  );
  const backendEnv = `BLOCKCHAIN_RPC_URL=${RPC_URL}
BLOCKCHAIN_CHAIN_ID=${CHAIN_ID}
BLOCKCHAIN_CONTRACT_ADDRESS=${contractAddress}
BLOCKCHAIN_BACKEND_ADDRESS=${backendAddress}
BLOCKCHAIN_BACKEND_PRIVATE_KEY=${BACKEND_PRIVATE_KEY}
BLOCKCHAIN_ABI_PATH=deployments/local-abi.json
`;

fs.writeFileSync(backendEnvPath, backendEnv);

  console.log("\n==========================================");
  console.log(" Local Blockchain Setup Complete");
  console.log("==========================================");
  console.log("RPC URL        :", RPC_URL);
  console.log("Chain ID       :", CHAIN_ID);
  console.log("Contract       :", contractAddress);
  console.log("Owner/Deployer :", deployerAddress);
  console.log("Backend Account:", backendAddress);
  console.log("Backend Issuer :", backendAuthorized);
  console.log("ABI            :", abiPath);
  console.log("Deployment     :", deploymentPath);
  console.log("Backend Config :", backendEnvPath);
  console.log("==========================================\n");

  console.log("ABI:");
  console.log(JSON.stringify(artifact.abi, null, 2));

  console.log("\nLocal Hardhat node is still running.");
  console.log("Press Ctrl+C to stop it.\n");

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("\nSetup failed:");
  console.error(error);
  cleanup();
  process.exit(1);
});