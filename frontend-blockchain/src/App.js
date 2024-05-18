import logo from './logo.svg';
import './App.css';
import {ethers} from 'ethers';

import tokenABI from './tokenABI.json';
import stakingABI from './stakingABI.json';

const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const stakingAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const loadData = async () => {
  try {
    // Request account access if needed
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // Create a new provider using window.ethereum
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get the signer from the provider
    const signer = provider.getSigner();

    // Instantiate the token contract with the signer (for read/write access)
    const tokenContr = new ethers.Contract(tokenAddress, tokenABI, signer);

    // Instantiate the staking contract with the signer (for read/write access)
    const stakingContr = new ethers.Contract(stakingAddress, stakingABI, signer);

    console.log('Token Contract:', tokenContr);
    console.log('Staking Contract:', stakingContr);

    // Optionally, perform some actions with the contracts
    // For example, read some data from the token contract
    const tokenName = await tokenContr.name();
    console.log('Token Name:', tokenName);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button onClick={loadData}>Click mee</button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
