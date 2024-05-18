// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

/*
Using ERC20Capped for maximum cap per token
*/

contract Token is ERC20Capped, AccessControl {
	bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
	bytes32 public constant BURN_ROLE = keccak256("BURN_ROLE");
	mapping (address => bool) public owners;
	uint256 public HOST_FEE = 1000 wei;

	event Mint(address indexed to, uint256 amount);
	event Burn(address indexed from, uint256 amount);

	constructor(string memory name, 
		string memory symbol, 
		uint256 initialSupply, 
		uint256 cap) ERC20(name, symbol) ERC20Capped(cap * (10 ** 18))  {
			_grantRole(MINT_ROLE, msg.sender);
			_grantRole(BURN_ROLE, msg.sender);
			owners[msg.sender] = true;
			if (initialSupply <= cap) {
            	ERC20._mint(_msgSender(), initialSupply * (10**18));
			}
	}

	modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }

	function changeOwner(address _newOwner)
        public
        validAddress(_newOwner) {
        _grantRole(MINT_ROLE, _newOwner);
		_grantRole(BURN_ROLE, _newOwner);
		owners[_newOwner] = true;
    }

	function payFee() public payable {
		require(msg.value >= HOST_FEE);
        changeOwner(msg.sender);
	}

	function mint(address to, uint256 amount) external  {
        require(hasRole(MINT_ROLE, msg.sender), "MyToken: must have MINT_ROLE to mint");
		require(owners[msg.sender] == true, "This address is not a co-owner");
        _mint(to, amount);
        emit Mint(to, amount);
    }
	
	function burn(address from, uint256 amount) public {
		require(hasRole(BURN_ROLE, msg.sender), "MyToken: must have BURN_ROLE to burn");
		require(owners[msg.sender] == true, "This address is not a co-owner");
		_burn(from, amount);
		emit Burn(from, amount);
	}
}