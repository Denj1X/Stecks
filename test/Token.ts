import { ethers } from "hardhat";
import { expect } from "chai";

describe("Token", function () {
 let Token: any;
 let owner: any;
 let addr1: any;
 let addr2: any;
 let addrs: any[];

 beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const TokenFactory = await ethers.getContractFactory("Token");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call TokenFactory.deploy() and await it.
    Token = await TokenFactory.deploy("MyToken", "MTK", 1000000, 2000000);
    await Token.waitForDeployment();
 });

 describe("Deployment", function () {
    it("Should mint the initial supply and cap", async function () {
      expect(await Token.totalSupply()).to.equal(ethers.parseEther("1000000"));
	  expect(await Token.cap()).to.equal(ethers.parseEther("2000000"));
    });

	it("Should assign the total supply to the owner account", async function () {
		expect(await Token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
	  });
 });

 describe("Minting", function () {
    it("Should mint tokens to the specified address", async function () {
      await Token.mint(addr1.address, ethers.parseEther("100"));
      expect(await Token.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if not the owner tries to mint", async function () {
      await expect(Token.connect(addr1).mint(addr1.address, ethers.parseEther("100"))).to.be.revertedWith("MyToken: must have MINT_ROLE to mint");
    });
 });

 describe("Burning", function () {
    it("Should burn tokens from the specified address", async function () {
      await Token.mint(addr1.address, ethers.parseEther("100"));
      await Token.burn(addr1.address, ethers.parseEther("50"));
      expect(await Token.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should fail if not the owner tries to burn", async function () {
      await expect(Token.connect(addr1).burn(addr1.address, ethers.parseEther("50"))).to.be.revertedWith("MyToken: must have BURN_ROLE to burn");
    });
 });

 describe("Roles and Ownership", function () {
    it("Only minter role can mint tokens", async function () {
      await expect(
        Token.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWith("MyToken: must have MINT_ROLE to mint");
    });

    it("Only burner role can burn tokens", async function () {
      await expect(
        Token.connect(addr1).burn(addr2.address, 50)
      ).to.be.revertedWith("MyToken: must have BURN_ROLE to burn");
    });
  });

  describe("Modifiers", function () {
    it("Should validate addresses correctly", async function () {
      await expect(Token.changeOwner("0x0000000000000000000000000000000000000000"))
       .to.be.revertedWith("Not valid address");
    });
  });
});