import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Deploying with account:", deployer.account.address);
  console.log("Chain ID:", await publicClient.getChainId());

  const sessionManager = await hre.viem.deployContract("SessionKeyManager" as any, []);
  console.log("SessionKeyManager deployed to:", sessionManager.address);

  const account = await hre.viem.deployContract("FabricXAccount" as any, [
    deployer.account.address,
    sessionManager.address,
  ]);
  console.log("FabricXAccount deployed to:", account.address);

  console.log("\n--- Deployment Summary ---");
  console.log("Network: X Layer Testnet (Chain ID 1952)");
  console.log("SessionKeyManager:", sessionManager.address);
  console.log("FabricXAccount:", account.address);
  console.log("Owner:", deployer.account.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
