import { expect } from "chai";
import hre from "hardhat";
import { parseEther, keccak256, toHex } from "viem";

describe("SessionKeyManager", function () {
  async function deploy() {
    const [owner] = await hre.viem.getWalletClients();
    const sessionManager = await hre.viem.deployContract("SessionKeyManager" as any, []);
    const publicClient = await hre.viem.getPublicClient();
    return { sessionManager, owner, publicClient };
  }

  it("creates a session with correct parameters", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-1"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    const session = await sessionManager.read.getSession([sessionId]);
    expect((session.owner as string).toLowerCase()).to.equal(owner.account.address.toLowerCase());
    expect(session.maxSpend).to.equal(parseEther("100"));
    expect(session.isActive).to.be.true;
  });

  it("validates an allowed action", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-2"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const swapAction = keccak256(toHex("swap"));

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [swapAction],
    ]);

    const valid = await sessionManager.read.validateSession([
      sessionId,
      parseEther("10"),
      swapAction,
    ]);
    expect(valid).to.be.true;
  });

  it("rejects an action not in the allowlist", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-3"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    const valid = await sessionManager.read.validateSession([
      sessionId,
      parseEther("10"),
      keccak256(toHex("bridge")),
    ]);
    expect(valid).to.be.false;
  });

  it("rejects spend exceeding maxSpend", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-4"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    const valid = await sessionManager.read.validateSession([
      sessionId,
      parseEther("200"),
      keccak256(toHex("swap")),
    ]);
    expect(valid).to.be.false;
  });

  it("records spend incrementally", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-5"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    await sessionManager.write.recordSpend([sessionId, parseEther("40")]);
    await sessionManager.write.recordSpend([sessionId, parseEther("30")]);

    const session = await sessionManager.read.getSession([sessionId]);
    expect(session.spendSoFar).to.equal(parseEther("70"));
  });

  it("revokes a session", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-6"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    await sessionManager.write.revokeSession([sessionId], { account: owner.account });
    const session = await sessionManager.read.getSession([sessionId]);
    expect(session.isActive).to.be.false;
  });

  it("isActive returns true for active session and false for revoked", async function () {
    const { sessionManager, owner } = await deploy();
    const sessionId = keccak256(toHex("session-isactive"));
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await sessionManager.write.createSession([
      sessionId,
      owner.account.address,
      parseEther("100"),
      expiresAt,
      [keccak256(toHex("swap"))],
    ]);

    const active = await sessionManager.read.isActive([sessionId]);
    expect(active).to.be.true;

    await sessionManager.write.revokeSession([sessionId], { account: owner.account });
    const afterRevoke = await sessionManager.read.isActive([sessionId]);
    expect(afterRevoke).to.be.false;
  });
});
