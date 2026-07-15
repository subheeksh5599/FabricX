import { expect } from "chai";
import hre from "hardhat";

describe("SessionKeyManagerV2", function () {
  async function deploy() {
    const [owner, account] = await hre.viem.getWalletClients();
    const skm = await hre.viem.deployContract("SessionKeyManagerV2" as any, []);
    return { skm, owner, account };
  }

  const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const TOKEN_A = "0x1111111111111111111111111111111111111111";
  const TOKEN_B = "0x2222222222222222222222222222222222222222";
  const ACTION_SWAP = "0x7377617000000000000000000000000000000000000000000000000000000000"; // keccak256("swap")
  const ACTION_BRIDGE = "0x6272696467650000000000000000000000000000000000000000000000000000"; // keccak256("bridge")
  const ACTION_STAKE = "0x7374616b65000000000000000000000000000000000000000000000000000000"; // keccak256("stake")

  it("creates a session with multi-token limits", async function () {
    const { skm, owner, account } = await deploy();
    const sessionId = `0x${"1".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId,
      account.account.address,
      expiresAt,
      500000n, // gasLimit
      [ACTION_SWAP, ACTION_BRIDGE],
      [NATIVE as `0x${string}`, TOKEN_A as `0x${string}`],
      [parseEther("5"), parseEther("1000")],
    ]);

    const session = await skm.read.getSession([sessionId]);
    expect(session.isActive).to.be.true;
    expect(session.gasLimit).to.equal(500000n);
    expect(session.tokenLimits.length).to.equal(2);
    expect(session.tokenLimits[0].maxSpend).to.equal(parseEther("5"));
    expect(session.tokenLimits[1].maxSpend).to.equal(parseEther("1000"));
  });

  it("validates multi-token spend limits", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"2".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 0n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    // Valid
    expect(await skm.read.validateSession([sessionId, NATIVE as `0x${string}`, parseEther("3"), ACTION_SWAP])).to.be.true;

    // Exceeds
    expect(await skm.read.validateSession([sessionId, NATIVE as `0x${string}`, parseEther("6"), ACTION_SWAP])).to.be.false;

    // Wrong token
    expect(await skm.read.validateSession([sessionId, TOKEN_A as `0x${string}`, parseEther("1"), ACTION_SWAP])).to.be.false;

    // Wrong action
    expect(await skm.read.validateSession([sessionId, NATIVE as `0x${string}`, parseEther("1"), ACTION_BRIDGE])).to.be.false;
  });

  it("records spend per token", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"3".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 0n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    await skm.write.recordSpend([sessionId, NATIVE as `0x${string}`, parseEther("2")]);
    const [max, spent] = await skm.read.getTokenLimit([sessionId, NATIVE as `0x${string}`]);
    expect(spent).to.equal(parseEther("2"));
    expect(max).to.equal(parseEther("5"));
  });

  it("records gas usage", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"4".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 100000n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    await skm.write.recordGas([sessionId, 50000n]);
    const remaining = await skm.read.getRemainingGas([sessionId]);
    expect(remaining).to.equal(50000n);
  });

  it("rejects gas usage exceeding limit", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"5".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 100000n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    await expect(
      skm.write.recordGas([sessionId, 200000n])
    ).to.be.rejectedWith("Exceeds gas limit");
  });

  it("revokes a session", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"6".repeat(64)}` as `0x${string}`;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 3600);

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 0n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    await skm.write.revokeSession([sessionId], { account: account.account });
    expect(await skm.read.isActive([sessionId])).to.be.false;
  });

  it("rejects expired session", async function () {
    const { skm, account } = await deploy();
    const sessionId = `0x${"7".repeat(64)}` as `0x${string}`;
    // Set expiry to very near future, then advance time past it
    const publicClient = await hre.viem.getPublicClient();
    const currentBlock = await publicClient.getBlock();
    const expiresAt = currentBlock.timestamp + 100n; // ~100 seconds from now

    await skm.write.createSession([
      sessionId, account.account.address, expiresAt, 0n,
      [ACTION_SWAP], [NATIVE as `0x${string}`], [parseEther("5")],
    ]);

    // Advance time past expiry
    await hre.network.provider.send("evm_increaseTime", [200]); // +200 seconds
    await hre.network.provider.send("evm_mine");

    expect(await skm.read.isActive([sessionId])).to.be.false;
  });
});

function parseEther(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e18));
}
