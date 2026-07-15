import hre from "hardhat";

async function deployCore(chainName: string) {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log(`\n=== Deploying to ${chainName} ===`);
  console.log("Deployer:", deployer.account.address);
  console.log("Chain ID:", await publicClient.getChainId());

  const sessionManager = await hre.viem.deployContract("SessionKeyManager" as any, []);
  console.log("SessionKeyManager:", sessionManager.address);

  const fabricXAccount = await hre.viem.deployContract("FabricXAccount" as any, [
    deployer.account.address,
    sessionManager.address,
  ]);
  console.log("FabricXAccount:", fabricXAccount.address);

  return {
    chain: chainName,
    sessionKeyManager: sessionManager.address,
    fabricXAccount: fabricXAccount.address,
    deployer: deployer.account.address,
  };
}

async function main() {
  const chain = process.env.CHAIN || "all";

  const deployments: any[] = [];

  if (chain === "all" || chain === "arbitrum_sepolia") {
    deployments.push(await deployCore("Arbitrum Sepolia"));
  }
  if (chain === "all" || chain === "base_sepolia") {
    deployments.push(await deployCore("Base Sepolia"));
  }
  if (chain === "all" || chain === "op_sepolia") {
    deployments.push(await deployCore("OP Sepolia"));
  }

  console.log("\n=== Multi-Chain Deployment Summary ===");
  for (const d of deployments) {
    console.log(`\n${d.chain}:`);
    console.log(`  SessionKeyManager: ${d.sessionKeyManager}`);
    console.log(`  FabricXAccount: ${d.fabricXAccount}`);
    console.log(`  Deployer: ${d.deployer}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
