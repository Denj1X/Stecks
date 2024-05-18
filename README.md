# Stecks
Blockchain Stake App with ERC20 Token with React frontend

## Getting Started

Hello! We are Matei-Alexandru Biciusca and Alexandru-Alin Potanga and we are creating a basic staking app, with different functionalities, including a frontend with React.js (in progress)
# App Features
This is a basic staking app, for staking tokens and earning rewards. Users can stake their tokens and earn rewards based on the reward rate set by the admin. The contracts are written in Solidity and use the OpenZeppelin library for security (in progress) and access control.

The app has the following features:

- [X] ERC20 Contract - A basic ERC20 contract, with a maximum cap and a mint function from ERC20. It has AccessControl, because only a certain minter (the owner), can actually supply with tokens. The ```Token.sol``` contract includes what I mentioned earlier. ERC20Capped inherited most of the functions and methods from ERC20, so we won't have a problem whether including ERC20 or not in the main contract.

- [X] Staking Contract -  The contract ```Staking.sol``` which includes the actual app features.
	- [X] Roles: The contract has an access control mechanism using the ```AccessControl``` contract from `OpenZeppelin`, where the admin role is defined as `ADMIN_ROLE`.
	- [ ] Small security measures: The contract uses the `ReentrancyGuard` and `Pausable` contracts from `OpenZeppelin` for additional security measures.
	- [X] Setting the reward: The contract has a reward rate set by the admin and the admin can add more reward tokens to the contract by calling the `addReward` function.
	- [X] User features: Users can stake, unstake, withdraw their reward, and reinvest their reward.
		- [X] Staking: Users can stake their tokens by calling the stake function and providing the amount to be staked.
		- [X] Unstaking: Users can unstake their tokens by calling the `unstake` function and providing the amount to be unstaked.
		- [X] Withdrawing: Users can withdraw their earned rewards by calling the `withdrawReward` function.
		- [X] Reinvesting: Users can reinvest their earned rewars by calling the `reinvestReward` function. This functionality is similar to a restake.
	- [X] Tracking: The contract maintains a `mapping` of each user and their `stakedAmount`, `rewardAmount`, and `lastRewardUpdate`. The `totalStakedAmount`, `totalLoanedAmount`, `rewardRate`, and `totalRewardAmount` are also tracked.
	- [X] Rewarding: The reward is computed based on the amount staked, the rewardRate, and the time since the last reward update. When a user unstakes their tokens, the reward is added to their balance if they have staked before, and if they have no stake and reward, the reward is sent directly to them.
	- [ ] Time conditioning: The contract has a cooldown period of 1 day for unstaking, withdrawing or reinvesting rewards to prevent abuse.
	- [ ] Staking or reinvesting with multiple tokens: Users can interact and use all functions with different tokens, eg: staking with a token, then unstaking or withdraw their reward with another token.
  - [ ] Using oracles or proxy pattern for security or making the contract upgradable.

 ### Pre Requisites
 We need npm. The version should 9.6.7 or above, in order to be the same with the version used by Hardhat.
 Using the template or using Hardhat standard environment from [hardhat]: https://hardhat.org/

When we're working with the Hardhat framework, we need those following commands:

#### Compile

Compile the smart contracts with Hardhat:

```sh
$ npx hardhat compile
```

#### TypeChain

Compile the smart contracts and generate TypeChain bindings:

```sh
$ npx hardhat typechain
```
We need those bindings for testing and deployment.

#### Test

Run the tests with Hardhat:

```sh
$ npx hardhat test
```

The tests are written in Typescript. Static analyzers might be used later on for different types of testing.


#### Coverage

We will use coverage to check if the methods are used, covered and tested:

```sh
$ npx hardhat coverage
```
## License

This project is licensed under MIT.
