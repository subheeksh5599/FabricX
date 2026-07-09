import { expect } from "chai";
import hre from "hardhat";
import { parseEther, keccak256, toHex, zeroAddress } from "viem";

describe("FabricXAccount", function () {
  async function deploy() {
    const [owner, agent] = await hre.viem.getWalletClients();

    const sessionManager = await hre.viem.deployContract("SessionKeyManager" as any, []);
    const account = await hre.viem.deployContract("FabricXAccount" as any, [
      owner.account.address,
      sessionManager.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();
    return { account, sessionManager, owner, agent, publicClient };
  }

  it("sets the correct owner and session manager", async function () {
    const { account, owner, sessionManager } = await deploy();
    expect((await account.read.owner() as string).toLowerCase()).to.equal(owner.account.address.toLowerCase());
    expect((await account.read.sessionManager() as string).toLowerCase()).to.equal(sessionManager.address.toLowerCase());
  });

  it("allows owner to add a session key", async function () {
    const { account, sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("agent-session-1"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await account.write.addSessionKey([
      sessionId,
      parseEther("10"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ], { account: owner.account });

    const session = await sessionManager.read.getSession([sessionId]);
    expect(session.isActive).to.be.true;
    expect(session.maxSpend).to.equal(parseEther("10"));
  });

  it("allows owner to revoke a session key", async function () {
    const { account, sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("agent-session-2"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await account.write.addSessionKey([
      sessionId,
      parseEther("10"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ], { account: owner.account });

    await account.write.revokeSessionKey([sessionId], { account: owner.account });
    const session = await sessionManager.read.getSession([sessionId]);
    expect(session.isActive).to.be.false;
  });

  it("rejects non-owner adding a session key", async function () {
    const { account, agent } = await deploy();
    const sessionId = keccak256(toHex("agent-session-3"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await expect(
      account.write.addSessionKey([
        sessionId,
        parseEther("10"),
        expiresAt,
        [keccak256(toHex("swap"))],
      ], { account: agent.account })
    ).to.be.rejected;
  });

  it("accepts ETH via receive", async function () {
    const { account, owner } = await deploy();
    const publicClient = await hre.viem.getPublicClient();

    await owner.sendTransaction({
      to: account.address,
      value: parseEther("1"),
    });

    const balance = await publicClient.getBalance({ address: account.address });
    expect(balance).to.equal(parseEther("1"));
  });
});
