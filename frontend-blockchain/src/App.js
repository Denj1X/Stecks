import logo from './logo.svg';
import './App.css';
import { ethers, utils } from 'ethers';
import React, { useState } from 'react';

import tokenABI from './tokenABI.json';
import stakingABI from './stakingABI.json';

const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const stakingAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

let tokenContr = null;
let stakingContr = null;

const loadData = async () => {
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();

    tokenContr = new ethers.Contract(tokenAddress, tokenABI, signer);

    stakingContr = new ethers.Contract(stakingAddress, stakingABI, signer);

    console.log('Token Contract:', tokenContr);
    console.log('Staking Contract:', stakingContr);
  } catch (error) {
    console.error('An error occurred during loadData:', error);
  }
};

function App() {
  const [isAdminInputVisible, setAdminInputVisible] = useState(false);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [isRewardInputVisible, setRewardInputVisible] = useState(false);
  const [reward, setReward] = useState('');
  const [isRestakeVisible, setRestakeVisible] = useState(false);

  const handleAdminButtonClick = () => {
    setAdminInputVisible(true);
  };

  const handleAdminInputChange = (event) => {
    setNewAdminAddress(event.target.value);
  };

  const handleAddAdmin = async () => {
    try {
      if (!tokenContr) {
        throw new Error('Token contract is not initialized. Please log in first.');
      }

      const tx = await tokenContr.changeOwner(newAdminAddress, {
        gasLimit: ethers.toBigInt(100000),
      });

      await tx.wait();

      console.log('Admin added successfully');
      setAdminInputVisible(false);
      setNewAdminAddress('');
    } catch (error) {
      console.error('An error occurred during addAdmin:', error);
    }
  };

  const handleRewardButtonClick = () => {
    setRewardInputVisible(true);
  };

  const handleRewardInputChange = (event) => {
    setReward(event.target.value);
  };

  const handleAddReward = async () => {
    try {
      if (!stakingContr) {
        throw new Error('Staking contract is not initialized. Please log in first.');
      }

      const rewardAmount = ethers.parseUnits(reward, 'wei'); 
      console.log(`Reward value to add: ${rewardAmount} (${reward} wei)`); 
      const tx = await stakingContr.addReward(rewardAmount, {
        gasLimit: ethers.toBigInt(100000),
      });

      await tx.wait();

      console.log('Reward added successfully');
      setRewardInputVisible(false);
      setReward('');
    } catch (error) {
      console.error('An error occurred during addReward:', error);
    }
  };

  const handleRestake = async () => {
    try {
      if (!stakingContr) {
        throw new Error('Staking contract is not initialized. Please log in first.');
      }

      const tx = await stakingContr.restake({
        gasLimit: ethers.toBigInt(1000000), 
      });

      await tx.wait();

      console.log('Restake successful');
    } catch (error) {
      console.error('An error occurred during restake:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Edit <code>src/App.js</code> and save to reload.</p>
        <button onClick={loadData}>Login Metamask</button>
        <button onClick={handleRewardButtonClick}>Add Reward</button>
        {isRewardInputVisible && (
          <div>
            <input
              type="text"
              value={reward}
              onChange={handleRewardInputChange}
              placeholder="Enter reward amount"
            />
            <button onClick={handleAddReward}>Submit</button>
          </div>
        )}
        <button onClick={handleAdminButtonClick}>Add Admin</button>
        {isAdminInputVisible && (
          <div>
            <input
              type="text"
              value={newAdminAddress}
              onChange={handleAdminInputChange}
              placeholder="Enter new admin address"
            />
            <button onClick={handleAddAdmin}>Submit</button>
          </div>
        )}
        <button onClick={() => setRestakeVisible(true)}>Restake</button>
        {isRestakeVisible && (
          <div>
            <button onClick={handleRestake}>Submit</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;