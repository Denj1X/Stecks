const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("Staking", () => {
  let stakingOwner: any;
  let user1: any;
  let user2: any;
  let name = "Xcoin";
  let symbol = "XCN";
  let initialSupply = 1000000;
  let cap = 100000000000000;
  let rewardRate = 1;
  let staking: any;

  beforeEach(async () => {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(
      name,
      symbol,
      initialSupply,
      cap,
      rewardRate
    );
    
    stakingOwner = owner;
    user1 = addr1;
    user2 = addr2;
  });

  // stake
  it("You can't create a stake with 0 coins", async () => {
    await expect(staking.stake(BigNumber.from("0"))).to.be.revertedWith(
      "Amount to be staked must be a pozitive number!"
    );
  });

  it("You can't stake more coins than your balance", async () => {

    await expect(
      staking.connect(user1).stake(BigNumber.from("1000"))
    ).to.be.revertedWith("You don't have enough balance to stake!");
  });

  it("When someone stake the user data should change!", async () => {
    let initialBalance = await staking.balanceOf(stakingOwner.address);

    const stakeTx = await staking
      .connect(stakingOwner)
      .stake(BigNumber.from("10000"));
    await stakeTx.wait();

    let balanceAfterStake = await staking.balanceOf(stakingOwner.address);

    let user = await staking.users(stakingOwner.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("10000"));
    expect(user.rewardAmount).to.eq(BigNumber.from("0"));
    expect(user.stakedAmount).to.eq(BigNumber.from("10000"));
    expect(balanceAfterStake).to.eq(
      initialBalance.sub(BigNumber.from("10000"))
    );
  });

  it("The amount of the reward should change if you already have a stake", async () => {
    const stakeTx = await staking.stake(BigNumber.from("10000"));
    await stakeTx.wait();

    let initialOwnerData = await staking.users(stakingOwner.address);
    expect(initialOwnerData.rewardAmount).to.eq(BigNumber.from("0"));

    const stakeTx2 = await staking.stake(BigNumber.from("10000"));
    await stakeTx2.wait();

    let secondOwnerData = await staking.users(stakingOwner.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("20000"));
    expect(secondOwnerData.stakedAmount).to.eq(BigNumber.from("20000"));
    expect(secondOwnerData.rewardAmount).to.not.eq(BigNumber.from("0"));
  });

  it("Check stake with 2 user", async () => {
    const stakeTx = await staking.stake(BigNumber.from("10000"));
    await stakeTx.wait();

    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("10000")
    );
    await transferTX.wait();

    const stakeTx2 = await staking
      .connect(user1)
      .stake(BigNumber.from("10000"));
    await stakeTx2.wait();

    let ownerData = await staking.users(stakingOwner.address);
    let userData = await staking.users(user1.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("20000"));
    expect(ownerData.stakedAmount).to.eq(BigNumber.from("10000"));
    expect(userData.stakedAmount).to.eq(BigNumber.from("10000"));
    expect(ownerData.rewardAmount).to.eq(BigNumber.from("0"));
    expect(userData.rewardAmount).to.eq(BigNumber.from("0"));
  });

  // unstake
  it("The unstake amount should be greater than 0", async () => {
    await expect(staking.unstake(BigNumber.from("0"))).to.be.revertedWith(
      "Amount to be unstaked must be a pozitive number!"
    );
  });

  it("The transaction will be reverted because the user unstake a bigger amount", async () => {
    await expect(staking.unstake(BigNumber.from("10"))).to.be.revertedWith(
      "You don't have enough staked amount to unstake!"
    );
  });

  it("When someone unstake some coins the total stake amount and user info should change!", async () => {
    let initialBalance = await staking.balanceOf(stakingOwner.address);

    const stakeTx = await staking
      .connect(stakingOwner)
      .stake(BigNumber.from("10000"));
    await stakeTx.wait();

    const unstakeTx = await staking
      .connect(stakingOwner)
      .unstake(BigNumber.from("5000"));
    await unstakeTx.wait();

    let finalBalance = await staking.balanceOf(stakingOwner.address);

    let user = await staking.users(stakingOwner.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("5000"));
    expect(user.stakedAmount).to.eq(BigNumber.from("5000"));
    expect(user.rewardAmount).to.not.eq(BigNumber.from("0"));
    expect(initialBalance).to.eq(finalBalance.add(BigNumber.from("5000")));
  });

  it("When someone unstake their entire stake amount, the reward amount should not be sent because we the pool doesn't have reward to give!", async () => {
    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("100000")
    );
    await transferTX.wait();

    let initialBalance = await staking.balanceOf(user1.address);

    const stakeTx = await staking.connect(user1).stake(BigNumber.from("10000"));
    await stakeTx.wait();

    // add 10 seconds to have time to gather reward
    await ethers.provider.send("evm_increaseTime", [10]);
    // force mine the next block
    await ethers.provider.send("evm_mine", []);

    const unstakeTx = await staking
      .connect(user1)
      .unstake(BigNumber.from("10000"));
    await unstakeTx.wait();

    let userData = await staking.users(user1.address);
    let finalBalance = await staking.balanceOf(user1.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("0"));
    expect(userData.stakedAmount).to.eq(BigNumber.from("0"));
    expect(userData.rewardAmount).to.not.eq(BigNumber.from("0"));
    expect(finalBalance).to.be.gte(initialBalance);
  });

  it("When someone unstake their entire stake amount, the reward amount should be sent, the pool has reward to give!", async () => {
    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("100000")
    );
    await transferTX.wait();

    let initialBalance = await staking.balanceOf(user1.address);

    const stakeTx = await staking.connect(user1).stake(BigNumber.from("10000"));
    await stakeTx.wait();

    // add reward
    const addRewardTx = await staking.addReward(BigNumber.from("10000"));
    await addRewardTx.wait();

    // add 10 seconds to have time to gather reward
    await ethers.provider.send("evm_increaseTime", [10]);
    // force mine the next block
    await ethers.provider.send("evm_mine", []);

    const unstakeTx = await staking
      .connect(user1)
      .unstake(BigNumber.from("10000"));
    await unstakeTx.wait();

    let userData = await staking.users(user1.address);
    let finalBalance = await staking.balanceOf(user1.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("0"));
    expect(userData.stakedAmount).to.eq(BigNumber.from("0"));
    expect(userData.rewardAmount).to.eq(BigNumber.from("0"));
    expect(finalBalance).to.be.gte(initialBalance);
  });

  it("After you unstake and withdraw reward try to stake", async () => {
    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("100000")
    );
    await transferTX.wait();

    // add reward
    const addRewardTx = await staking.addReward(BigNumber.from("10000"));
    await addRewardTx.wait();

    const stakeTx = await staking.connect(user1).stake(BigNumber.from("10000"));
    await stakeTx.wait();

    const unstakeTx = await staking
      .connect(user1)
      .unstake(BigNumber.from("5000"));
    await unstakeTx.wait();

    const withdrawTx = await staking.connect(user1).withdrawReward();
    await withdrawTx.wait();

    // get balance after unstake half of staked amount and withdraw reward
    let initialBalance = await staking.balanceOf(user1.address);

    const secondStakeTx = await staking
      .connect(user1)
      .stake(BigNumber.from("5000"));
    await secondStakeTx.wait();

    let ownerData = await staking.users(user1.address);

    // get the balance after staking another 5000 coints
    let finalBalance = await staking.balanceOf(user1.address);

    expect(await staking.totalStakedAmount()).to.eq(BigNumber.from("10000"));
    expect(ownerData.stakedAmount).to.eq(BigNumber.from("10000"));
    expect(ownerData.rewardAmount).to.not.eq(BigNumber.from("0"));
    expect(initialBalance).to.eq(finalBalance.add(BigNumber.from("5000")));
  });

  // withdrawReward
  it("The stake amount should not be 0 before withdrawing the reward", async () => {
    await expect(staking.withdrawReward()).to.be.revertedWith(
      "You must stake before withdrawing the reward!"
    );
  });

  it("The withdraw reward was a success", async () => {
    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("100000")
    );
    await transferTX.wait();

    // add reward
    const addRewardTx = await staking.addReward(BigNumber.from("10000"));
    await addRewardTx.wait();

    let initialBalance = await staking.balanceOf(user1.address);

    const stakeTx = await staking.connect(user1).stake(BigNumber.from("10000"));
    await stakeTx.wait();

    // add 5 seconds to have time to gather reward
    await ethers.provider.send("evm_increaseTime", [5]);

    const withdrawTx = await staking.connect(user1).withdrawReward();
    await withdrawTx.wait();

    let finalBalance = await staking.balanceOf(user1.address);

    expect(finalBalance).to.eq(initialBalance.sub(BigNumber.from("9995")));
  });

  // computeReward
  it("The stake amount should not be 0 before computing the reward", async () => {
    await expect(
      staking.computeReward(stakingOwner.address)
    ).to.be.revertedWith("User must stake before computing the reward!");
  });

  it("Test compute reward should return a pozitive amount", async () => {
    const stakeTx = await staking.stake(BigNumber.from("10000"));
    await stakeTx.wait();

    const stakeTx2 = await staking.stake(BigNumber.from("10000"));
    await stakeTx2.wait();

    // add 10 seconds to have time to gather reward
    await ethers.provider.send("evm_increaseTime", [10]);
    // force mine the next block
    await ethers.provider.send("evm_mine", []);

    expect(await staking.computeReward(stakingOwner.address)).to.be.gt(
      BigNumber.from("0")
    );
  });

  // reinvestReward
  it("You can't reinvest if stake amount is 0", async () => {
    await expect(staking.connect(user1).reinvestReward()).to.be.revertedWith(
      "You must stake before reinvesting the reward!"
    );
  });

  it("Reinvest test", async () => {
    const transferTX = await staking.transfer(
      user1.address,
      BigNumber.from("100000")
    );
    await transferTX.wait();

    // add reward
    const addRewardTx = await staking.addReward(BigNumber.from("10000"));
    await addRewardTx.wait();

    const stakeTx = await staking.connect(user1).stake(BigNumber.from("10000"));
    await stakeTx.wait();

    let initialUserData = await staking.users(user1.address);

    expect(initialUserData.rewardAmount).to.eq(BigNumber.from("0"));
    expect(initialUserData.stakedAmount).to.eq(BigNumber.from("10000"));

    // add 10 seconds to have time to gather reward
    await ethers.provider.send("evm_increaseTime", [10]);
    // force mine the next block
    await ethers.provider.send("evm_mine", []);

    const reinvestTx = await staking.connect(user1).reinvestReward();
    await reinvestTx.wait();

    let finalUserData = await staking.users(user1.address);

    expect(await staking.totalStakedAmount()).to.be.gt(BigNumber.from("10000"));
    expect(finalUserData.stakedAmount).to.be.gt(BigNumber.from("10000"));
    expect(finalUserData.rewardAmount).to.eq(BigNumber.from("0"));
  });

  it("Only the owner can add reward to the contract", async () => {
    await expect(
      staking.connect(user1).addReward(BigNumber.from("10000"))
    ).to.be.revertedWith("You can't add a reward");
  });

  it("The reward amount to be added should be positive", async () => {
    await expect(staking.addReward(BigNumber.from("0"))).to.be.revertedWith(
      "Amount to be added must be a pozitive number!"
    );
  });

  it("The owner can add reward", async () => {
    expect(await staking.totalRewardAmount()).to.eq(BigNumber.from("0"));

    const addRewardTx = await staking.addReward(BigNumber.from("10000"));
    await addRewardTx.wait();

    expect(await staking.totalRewardAmount()).to.eq(BigNumber.from("10000"));
  });
});

describe("Token", function () {
	let Token: ReturnType<typeof ethers.ContractFactory>;
	let token: ReturnType<typeof ethers.Contract>;
	let owner: any;
	let addr1: any;
	let addr2: any;
  
	beforeEach(async function () {
	  Token = await ethers.getContractFactory("Token");
	  [owner, addr1, addr2] = await ethers.getSigners();
	  token = await Token.deploy("MyToken", "MTK", 1000000, 10000000);
	  await token.waitForDeployment();
	});
  
	describe("Deployment", function () {
	  it("Should assign the total supply of tokens to the owner", async function () {
		const ownerBalance = await token.balanceOf(owner.address);
		expect(await token.totalSupply()).to.equal(ownerBalance);
	  });
	});
  
	describe("Minting", function () {
	  it("Should mint tokens correctly", async function () {
		const initialSupply = await token.totalSupply();
		await token.mint(addr1.address, 1000);
		expect(await token.balanceOf(addr1.address)).to.equal(1000);
		expect(await token.totalSupply()).to.equal(initialSupply.add(1000));
	  });
	});
  
	describe("Burning", function () {
	  it("Should burn tokens correctly", async function () {
		await token.mint(addr1.address, 1000);
		const initialSupply = await token.totalSupply();
		await token.burn(addr1.address, 500);
		expect(await token.balanceOf(addr1.address)).to.equal(500);
		expect(await token.totalSupply()).to.equal(initialSupply.sub(500));
	  });
	});
  });
  
  export {};