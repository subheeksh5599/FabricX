import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("EscrowPayments", function () {
  async function deploy() {
    const [user, asp] = await hre.viem.getWalletClients();
    const escrow = await hre.viem.deployContract("EscrowPayments" as any, []);
    return { escrow, user, asp };
  }

  it("creates an escrow with deposit", async function () {
    const { escrow, user, asp } = await deploy();
    const escrowId = `0x${"f".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await escrow.write.createEscrow(
      [escrowId, asp.account.address, deadline],
      { value: parseEther("2"), account: user.account }
    );

    const e = await escrow.read.getEscrow([escrowId]);
    expect(e.amount).to.equal(parseEther("2"));
    expect(e.asp.toLowerCase()).to.equal(asp.account.address.toLowerCase());
    expect(e.released).to.be.false;
  });

  it("user releases funds to ASP", async function () {
    const { escrow, user, asp } = await deploy();
    const escrowId = `0x${"1".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await escrow.write.createEscrow(
      [escrowId, asp.account.address, deadline],
      { value: parseEther("1"), account: user.account }
    );

    await escrow.write.releaseFunds([escrowId], { account: user.account });

    const e = await escrow.read.getEscrow([escrowId]);
    expect(e.released).to.be.true;
  });

  it("user can refund before release", async function () {
    const { escrow, user, asp } = await deploy();
    const escrowId = `0x${"2".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await escrow.write.createEscrow(
      [escrowId, asp.account.address, deadline],
      { value: parseEther("1"), account: user.account }
    );

    await escrow.write.refund([escrowId], { account: user.account });

    const e = await escrow.read.getEscrow([escrowId]);
    expect(e.refunded).to.be.true;
  });

  it("prevents double release", async function () {
    const { escrow, user, asp } = await deploy();
    const escrowId = `0x${"3".repeat(64)}` as `0x${string}`;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await escrow.write.createEscrow(
      [escrowId, asp.account.address, deadline],
      { value: parseEther("1"), account: user.account }
    );

    await escrow.write.releaseFunds([escrowId], { account: user.account });

    await expect(
      escrow.write.releaseFunds([escrowId], { account: user.account })
    ).to.be.rejectedWith("Already released");
  });
});
