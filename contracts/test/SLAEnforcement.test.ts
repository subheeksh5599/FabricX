import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("SLAEnforcement", function () {
  async function deploy() {
    const [user, asp, evaluator] = await hre.viem.getWalletClients();
    const sla = await hre.viem.deployContract("SLAEnforcement" as any, []);
    return { sla, user, asp, evaluator };
  }

  it("creates an SLA with stake", async function () {
    const { sla, user, asp } = await deploy();
    const slaId = `0x${"a".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
    const deliverableHash = `0x${"b".repeat(64)}` as `0x${string}`;

    await sla.write.createSLA(
      [slaId, user.account.address, deadline, deliverableHash],
      { value: parseEther("1"), account: asp.account }
    );

    const s = await sla.read.getSLA([slaId]);
    expect(s.stake).to.equal(parseEther("1"));
    expect(s.asp.toLowerCase()).to.equal(asp.account.address.toLowerCase());
    expect(s.user.toLowerCase()).to.equal(user.account.address.toLowerCase());
  });

  it("ASP can deliver and withdraw stake after deadline + 3 days", async function () {
    const { sla, user, asp } = await deploy();
    const slaId = `0x${"c1".repeat(32)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await sla.write.createSLA(
      [slaId, user.account.address, deadline, deliverableHash],
      { value: parseEther("1"), account: asp.account }
    );

    await sla.write.deliver([slaId], { account: asp.account });

    // Can't withdraw immediately
    await expect(
      sla.write.withdrawStake([slaId], { account: asp.account })
    ).to.be.rejected;

    const s = await sla.read.getSLA([slaId]);
    expect(s.delivered).to.be.true;
  });

  it("user can dispute a delivery", async function () {
    const { sla, user, asp } = await deploy();
    const slaId = `0x${"d".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await sla.write.createSLA(
      [slaId, user.account.address, deadline, deliverableHash],
      { value: parseEther("1"), account: asp.account }
    );

    await sla.write.deliver([slaId], { account: asp.account });
    await sla.write.dispute([slaId, "Not good enough"], { account: user.account });

    const s = await sla.read.getSLA([slaId]);
    expect(s.disputed).to.be.true;
  });

  it("evaluator can resolve dispute with slashing", async function () {
    const { sla, user, asp, evaluator } = await deploy();
    const slaId = `0x${"e1".repeat(32)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await sla.write.createSLA(
      [slaId, user.account.address, deadline, deliverableHash],
      { value: parseEther("1"), account: asp.account }
    );

    await sla.write.deliver([slaId], { account: asp.account });
    await sla.write.dispute([slaId, "Bad quality"], { account: user.account });

    // Evaluator resolves: ASP at fault, 50% slash
    await sla.write.resolve([slaId, true, 50n], { account: evaluator.account });

    const s = await sla.read.getSLA([slaId]);
    expect(s.resolved).to.be.true;
    expect(s.resolver.toLowerCase()).to.equal(evaluator.account.address.toLowerCase());
  });
});

const deliverableHash = `0x${"b".repeat(64)}` as `0x${string}`;
