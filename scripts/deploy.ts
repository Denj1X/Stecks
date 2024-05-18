import { ethers } from "hardhat";

async function main() {
	//deploy Token
	let owner, addr1, addr2: any;
	let addrs: any[];
	[addr1, addr2, ...addrs] = await ethers.getSigners();
	[owner] = await ethers.getSigners();
	const TokenFactory = await ethers.getContractFactory("Token");
	let Token = await TokenFactory.deploy("MyToken", "MTK", 1000000, 2000000);
	await Token.waitForDeployment();

	console.log("Token deployed to: ", Token.target);

	const StakingFactory = await ethers.getContractFactory("Staking");
	let Staking = await StakingFactory.deploy("MyToken", "MTK", 1000000, 2000000);
	await Staking.waitForDeployment();

	console.log("Staking deployed to: ", Staking.target);

	await Staking.connect(owner).changeOwn(Token.target)
	console.log("Deployed Staking Contract at: ", Staking.target)
  	console.log("Deployed Token Contract at: ", Token.target)
  	console.log("Owner: ", owner.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });