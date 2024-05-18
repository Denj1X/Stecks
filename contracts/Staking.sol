// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Token.sol";

/*
Using ReentrancyGuard and Pausable contracts from OpenZeppelin for
safe measures
*/
contract Staking is Token  {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	struct user {
        uint256 stakedAmount;
        uint256 rewardAmount;
        uint256 lastRewardUpdate;
    }

    mapping(address => user) public users;

    uint256 public totalStakedAmount;
    uint256 public totalLoanedAmount;
    uint256 public rewardRate;
    uint256 public totalRewardAmount;

    event UpdatedTotalStakedAmount(uint256 totalStakedAmount);
    event UpdatedUserInfo(
        uint256 stakedAmount,
        uint256 rewardAmount,
        uint256 lastRewardUpdate
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _cap,
        uint256 _rewardRate
    ) Token(_name, _symbol, _initialSupply, _cap) {
		_grantRole(ADMIN_ROLE, msg.sender);
        rewardRate = _rewardRate;
    }

    function addReward(uint256 _amount) external {
		require(hasRole(ADMIN_ROLE, msg.sender), "You can't add a reward");
        require(_amount > 0, "Amount to be added must be a pozitive number!");

        totalRewardAmount += _amount;
        _burn(msg.sender, _amount);
    }

	function computeReward(address _user) public view returns (uint256) {
        require(
            users[_user].stakedAmount > 0,
            "User must stake before computing the reward!"
        );

        return
            ((block.timestamp - users[_user].lastRewardUpdate) *
                users[_user].stakedAmount *
                rewardRate) / totalStakedAmount;
    }

	function reinvestReward() external {
        require(
            users[msg.sender].stakedAmount > 0,
            "You must stake before reinvesting the reward!"
        );

        // make sure the reward value is up to date
        users[msg.sender].rewardAmount += computeReward(msg.sender);

        require(users[msg.sender].rewardAmount <= totalRewardAmount, "The reward is not available!");

        totalRewardAmount -= users[msg.sender].rewardAmount;

        // increase the stake from the reward, reset the reward and the date
        totalStakedAmount += users[msg.sender].rewardAmount;
        users[msg.sender].stakedAmount += users[msg.sender].rewardAmount;
        users[msg.sender].rewardAmount = 0;
        users[msg.sender].lastRewardUpdate = block.timestamp;

        emit UpdatedTotalStakedAmount(totalStakedAmount);

        emit UpdatedUserInfo(
            users[msg.sender].stakedAmount,
            users[msg.sender].rewardAmount,
            users[msg.sender].lastRewardUpdate
        );
    }

    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount to be staked must be a pozitive number!");

        require(
            _amount <= balanceOf(msg.sender),
            "You don't have enough balance to stake!"
        );

        // if the user already has a staked amount compute his reward for the
        // old stake amount
        if (users[msg.sender].stakedAmount != 0) {
            users[msg.sender].rewardAmount += computeReward(msg.sender);
        }

        // add the user stake to the pool and update the last reward update
        totalStakedAmount += _amount;
        users[msg.sender].stakedAmount += _amount;
        users[msg.sender].lastRewardUpdate = block.timestamp;

        // remove the amount from the user's balance
        _burn(msg.sender, _amount);

        emit UpdatedTotalStakedAmount(totalStakedAmount);

        emit UpdatedUserInfo(
            users[msg.sender].stakedAmount,
            users[msg.sender].rewardAmount,
            users[msg.sender].lastRewardUpdate
        );
    }

    function unstake(uint256 _amount) external {
        require(_amount > 0, "Amount to be unstaked must be a pozitive number!");

        require(_amount <= users[msg.sender].stakedAmount, "You don't have enough staked amount to unstake!");
        // compute the reward to be up to date and reset the last reward update
        // time before removing part of the stake to avoid giving the user a
        // smaller reward at a later time
        users[msg.sender].rewardAmount += computeReward(msg.sender);
        users[msg.sender].lastRewardUpdate = block.timestamp;

        // remove _amount from the user's stake
        totalStakedAmount -= _amount;
        users[msg.sender].stakedAmount -= _amount;

        // if the user removes all the stake, send him the reward as well
        uint256 amountToUnstake = _amount;
        if (users[msg.sender].stakedAmount == 0 && users[msg.sender].rewardAmount <= totalRewardAmount) {
            totalRewardAmount -= users[msg.sender].rewardAmount;
            amountToUnstake += users[msg.sender].rewardAmount;
            users[msg.sender].rewardAmount = 0;
        }

        // send the amount to the user
        _mint(msg.sender, amountToUnstake);

        emit UpdatedTotalStakedAmount(totalStakedAmount);

        emit UpdatedUserInfo(
            users[msg.sender].stakedAmount,
            users[msg.sender].rewardAmount,
            users[msg.sender].lastRewardUpdate
        );
    }

    function withdrawReward() external {
        require(users[msg.sender].stakedAmount > 0, "You must stake before withdrawing the reward!");
        // compute the reward to be up to date
        uint256 reward = users[msg.sender].rewardAmount + computeReward(msg.sender);

        users[msg.sender].lastRewardUpdate = block.timestamp;

        require(reward <= totalRewardAmount, "The reward is not available!");

        totalRewardAmount -= reward;
        // send the reward to the user
        _mint(msg.sender, reward);
        // reset the reward count
        users[msg.sender].rewardAmount = 0;

        emit UpdatedUserInfo(
            users[msg.sender].stakedAmount,
            users[msg.sender].rewardAmount,
            users[msg.sender].lastRewardUpdate
        );
    }
}

