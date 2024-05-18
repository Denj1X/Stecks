import { ethers } from "hardhat";
import { expect } from "chai";

describe("Staking Contract", function () {
  let Staking;
  let staking: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;

  beforeEach(async function () {
    Staking = await ethers.getContractFactory("Staking");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy a new Staking contract before each test.
    staking = await Staking.deploy("Test Token", "TST", 1000000, 2000000);
    await staking.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial values", async function () {
      expect(await staking.totalStaked()).to.equal(ethers.parseEther("0"));
      expect(await staking.stakersCount()).to.equal(ethers.parseEther("0"));
      expect(await staking.isStaker(owner.address)).to.equal(false);
    });
  });

  describe("Transactions", function () {
    it("Should deposit and withdraw correctly", async function () {
      await staking.connect(addr1).deposit(500);
      expect(await staking.stakersCount()).to.equal(1);
      expect(await staking.isStaker(addr1.address)).to.equal(true);

      await staking.connect(addr1).withdraw(250);
      expect(await staking.stakersCount()).to.equal(1);
      expect(await staking.isStaker(addr1.address)).to.equal(true);
    });

    it("Should collect rewards correctly", async function () {
      await staking.connect(addr1).deposit(500);
      await staking.distributeRewards(1000); // Distribute rewards
      await staking.connect(addr1).collect(); // Collect rewards
      expect(await staking.getReward(addr1.address)).to.equal(0); // No rewards left
    });

    it("Should distribute rewards correctly", async function () {
      await staking.connect(addr1).deposit(500);
      await staking.connect(addr2).deposit(500);
      await staking.distributeRewards(1000); // Distribute rewards
      expect(await staking.getReward(addr1.address)).greaterThan(0); // Rewards distributed
      expect(await staking.getReward(addr2.address)).greaterThan(0); // Rewards distributed
    });

    it("Should fail to withdraw more than balance", async function () {
      await expect(staking.connect(addr1).withdraw(600)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Admin Functions", function () {
    it("Should add rewards correctly", async function () {
      await staking.connect(owner).addReward(1000);
      expect(await staking.totalStaked()).to.equal(1000);
    });

    it("Should fail to add rewards without admin role", async function () {
      await expect(staking.connect(addr1).addReward(1000)).to.be.revertedWith("Address doesn't have admin role");
    });
  });
});
