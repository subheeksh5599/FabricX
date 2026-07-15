import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("Deploying with account:", deployer.account.address);
  console.log("Chain ID:", await publicClient.getChainId());

  // Phase 1: Core contracts
  const sessionManager = await hre.viem.deployContract("SessionKeyManager" as any, []);
  console.log("SessionKeyManager deployed to:", sessionManager.address);

  const fabricXAccount = await hre.viem.deployContract("FabricXAccount" as any, [
    deployer.account.address,
    sessionManager.address,
  ]);
  console.log("FabricXAccount deployed to:", fabricXAccount.address);

  // Phase 2: V2 contracts (multi-token + gas abstraction)
  const sessionManagerV2 = await hre.viem.deployContract("SessionKeyManagerV2" as any, []);
  console.log("SessionKeyManagerV2 deployed to:", sessionManagerV2.address);

  // Phase 4: Marketplace contracts
  const aspReputation = await hre.viem.deployContract("ASPReputation" as any, []);
  console.log("ASPReputation deployed to:", aspReputation.address);

  const slaEnforcement = await hre.viem.deployContract("SLAEnforcement" as any, []);
  console.log("SLAEnforcement deployed to:", slaEnforcement.address);

  const escrowPayments = await hre.viem.deployContract("EscrowPayments" as any, []);
  console.log("EscrowPayments deployed to:", escrowPayments.address);

  console.log("\n--- Deployment Summary ---");
  console.log("Network: X Layer Testnet (Chain ID 1952)");
  console.log("Phase 1 - SessionKeyManager:", sessionManager.address);
  console.log("Phase 1 - FabricXAccount:", fabricXAccount.address);
  console.log("Phase 2 - SessionKeyManagerV2:", sessionManagerV2.address);
  console.log("Phase 4 - ASPReputation:", aspReputation.address);
  console.log("Phase 4 - SLAEnforcement:", slaEnforcement.address);
  console.log("Phase 4 - EscrowPayments:", escrowPayments.address);
  console.log("Owner:", deployer.account.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
