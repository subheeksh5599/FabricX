import { expect } from "chai";
import hre from "hardhat";

describe("ASPReputation", function () {
  async function deploy() {
    const [asp, rater1, rater2] = await hre.viem.getWalletClients();
    const rep = await hre.viem.deployContract("ASPReputation" as any, []);
    return { rep, asp, rater1, rater2 };
  }

  it("registers an ASP", async function () {
    const { rep, asp } = await deploy();
    await rep.write.register([], { account: asp.account });
    expect(await rep.read.registeredASPs([asp.account.address])).to.be.true;
  });

  it("allows rating an ASP (1-5 stars)", async function () {
    const { rep, asp, rater1 } = await deploy();
    await rep.write.register([], { account: asp.account });

    await rep.write.rate([asp.account.address, 5, "Excellent work!"], { account: rater1.account });
    const avg = await rep.read.getAverageRating([asp.account.address]);
    expect(avg).to.equal(500n); // 5 * 100
  });

  it("calculates average correctly with multiple ratings", async function () {
    const { rep, asp, rater1, rater2 } = await deploy();
    await rep.write.register([], { account: asp.account });

    await rep.write.rate([asp.account.address, 4, "Good"], { account: rater1.account });
    await rep.write.rate([asp.account.address, 2, "Meh"], { account: rater2.account });

    const avg = await rep.read.getAverageRating([asp.account.address]);
    expect(avg).to.equal(300n); // (4+2)/2 * 100 = 300
    expect(await rep.read.getRatingCount([asp.account.address])).to.equal(2n);
  });

  it("prevents self-rating", async function () {
    const { rep, asp } = await deploy();
    await rep.write.register([], { account: asp.account });

    await expect(
      rep.write.rate([asp.account.address, 5, "I'm great"], { account: asp.account })
    ).to.be.rejectedWith("Cannot rate yourself");
  });

  it("allows updating a rating", async function () {
    const { rep, asp, rater1 } = await deploy();
    await rep.write.register([], { account: asp.account });

    await rep.write.rate([asp.account.address, 3, "OK"], { account: rater1.account });
    await rep.write.rate([asp.account.address, 5, "Better now"], { account: rater1.account });

    const avg = await rep.read.getAverageRating([asp.account.address]);
    expect(avg).to.equal(500n); // Updated to 5
  });

  it("rejects score outside 1-5", async function () {
    const { rep, asp, rater1 } = await deploy();
    await rep.write.register([], { account: asp.account });

    await expect(
      rep.write.rate([asp.account.address, 0, "Zero"], { account: rater1.account })
    ).to.be.rejectedWith("Score must be 1-5");

    await expect(
      rep.write.rate([asp.account.address, 6, "Six"], { account: rater1.account })
    ).to.be.rejectedWith("Score must be 1-5");
  });
});
