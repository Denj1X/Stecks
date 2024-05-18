// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Token.sol";

/*
Using ReentrancyGuard and Pausable contracts from OpenZeppelin for
safe measures
*/

contract Staking is Token  {

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	struct Staker {
        uint256 balance;
        uint256 depositTime;
        uint256 cumulativeRewards;
    }

    mapping(address => Staker) public stakers;
    uint256 public stakersCount;
    uint256 public totalStaked;
    uint256 public totalRewardPaid;
    address[] public stakersArr;
    uint256 public constant YEAR_IN_SECONDS = 31536000;
    uint256 public constant SIX_MONTHS_IN_SECONDS = 15768000;
    uint256 public constant THREE_MONTHS_IN_SECONDS = 7884000;
    uint256 public constant ONE_MONTH_IN_SECONDS = 2628000;
    uint256 public constant ONE_WEEK_IN_SECONDS = 604800;
    address public fixeAddress;
    IERC20 public Fixe;

	event Deposit(address _address, uint256 amount);
	event Withdraw(address _address, uint256 amount);
	event Collected(address sender, uint256 reward);
	event DividendPaid(uint256 amountToTransfer);


    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _cap
    ) Token(_name, _symbol, _initialSupply, _cap) {
		_grantRole(ADMIN_ROLE, msg.sender);
		Fixe = IERC20(address(this));
    }

	function addReward(uint256 amount) public {
		require(amount > 0, "Amount to be added must be a pozitive number!");
		require(hasRole(ADMIN_ROLE, msg.sender), "Address doesn't have admin role");

		totalStaked += amount;
		_burn(msg.sender, amount);
	}

	function deposit(uint256 amount) external {
    	Staker storage staker = stakers[msg.sender];
    	address thisAddress = address(this);
    	address from = msg.sender;

    	if (staker.balance > 0 && staker.cumulativeRewards > 0) {
        	Fixe.transfer(msg.sender, staker.cumulativeRewards);
        	staker.balance += amount;
        	Fixe.transferFrom(from, thisAddress, amount); // Use FixeToken instead of Fixe
    	} 
		else {
        	Fixe.transferFrom(from, thisAddress, amount); // Use FixeToken instead of Fixe
        	staker.balance = amount;
        	stakersArr.push(from);
        	stakersCount++;
        	staker.depositTime = block.timestamp;
    	}

    	totalStaked += amount;
    	emit Deposit(msg.sender, amount);
	}

	function withdraw(uint256 amount) external {
    	address sender = msg.sender;
    	Staker storage staker = stakers[sender];
    	address thisAddress = address(this);

    	require(staker.balance >= amount, "Insufficient balance");
    	require(amount > 0, "Amount must be greater than zero");

    	Fixe.transfer(sender, amount);

    	staker.balance -= amount;
    	totalStaked -= amount;
    	staker.depositTime = block.timestamp;
    	emit Withdraw(thisAddress, amount);
	}

	function collect() external {
    	address sender = msg.sender;
    	Staker storage staker = stakers[sender];
    	uint256 reward = staker.cumulativeRewards;

    	require(reward > 0, "Nothing to collect");

   	 	Fixe.transfer(sender, reward);
    	staker.cumulativeRewards = 0; // Reset cumulative rewards to zero
    	emit Collected(sender, reward);
	}

	function restake() external {
    	address sender = msg.sender;
    	Staker storage staker = stakers[sender];
    	uint256 reward = staker.cumulativeRewards;
    	require(reward >= 0, "Nothing to collect");

    	staker.balance += reward;
    	staker.cumulativeRewards = 0;

    	emit Deposit(msg.sender, reward);
	}

	function distributeRewards(uint256 rewardAmount) external {
    	require(totalStaked > 0, "No stakers to distribute rewards");
    	require(rewardAmount > 0, "Reward amount must be greater than zero");

    	uint256 currentTime = block.timestamp;
    	uint256 totalRewards = rewardAmount;
    	uint256 paidRewards;

    	for (uint256 i = 0; i < stakersArr.length; i++) {
       		address stakerAddress = stakersArr[i];
        	Staker storage staker = stakers[stakerAddress];

        	if (staker.balance > 0) {
            	uint256 stakerRewards = calculateStakerRewards(staker, currentTime, totalRewards);

            // Add rewards to staker's balance and cumulative rewards
            	staker.cumulativeRewards += stakerRewards;
            	paidRewards += stakerRewards;
        	}
    	}

    	uint256 amountToTransfer = totalRewards - paidRewards;
    	Fixe.transferFrom(msg.sender, address(this), amountToTransfer);
    	totalRewardPaid += amountToTransfer;
    	emit DividendPaid(amountToTransfer);
	}

	function calculateStakerRewards(Staker storage staker, uint256 currentTime, uint256 totalRewards) 
	internal view returns (uint256) {
    	uint256 stakingPeriod = currentTime - staker.depositTime;

    	if (stakingPeriod >= YEAR_IN_SECONDS) {
        	return totalRewards;
    	} 
		else if (stakingPeriod >= SIX_MONTHS_IN_SECONDS) {
        	return totalRewards * staker.balance * 75 / totalStaked / 100;
    	} 
		else if (stakingPeriod >= THREE_MONTHS_IN_SECONDS) {
        	return totalRewards * staker.balance * 50 / totalStaked / 100;
    	} 
		else if (stakingPeriod >= ONE_MONTH_IN_SECONDS) {
        	return totalRewards * staker.balance * 25 / totalStaked / 100;
    	} 
		else if (stakingPeriod >= ONE_WEEK_IN_SECONDS) {
        	return totalRewards * staker.balance * 10 / totalStaked / 100;
    	} 
		else {
        	return totalRewards * staker.balance * 5 / totalStaked / 100;
    	}
	}

	function getStaker(address _address) external view
    returns (uint256 balance, uint256 depositTime, uint256 cumulativeRewards) {
    	Staker storage staker = stakers[_address];
    	return (staker.balance, staker.depositTime, staker.cumulativeRewards);
	}

	function isStaker(address _address) external view returns (bool) {
    	return stakers[_address].balance > 0;
	}

	function getReward(address _address) external view returns (uint256) {
    	Staker storage staker = stakers[_address];
    	uint256 reward = staker.cumulativeRewards;
    	return reward;
	}
}
