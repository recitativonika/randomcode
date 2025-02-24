const axios = require('axios');
const fs = require('fs');
const path = require('path');

function readWalletsFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('Error reading wallet file:', error.message);
    return [];
  }
}

async function processRequest(wallet) {
  const url = `https://backend.gas.zip/v2/monadEligibility/${wallet}`;
  const params = {
    claim: true
  };

  try {
    const response = await axios.get(url, { params });
    if (response.status === 200) {
      console.log(`Request for wallet ${wallet} was successful:`, response.data);
    } else {
      console.log(`Request for wallet ${wallet} failed with status:`, response.status);
    }
  } catch (error) {
    console.error(`Error occurred while processing wallet ${wallet}:`, error.message);
  }
}

function startProcessingLoop() {
  const wallets = readWalletsFromFile(path.join(__dirname, 'wallet.txt'));
  if (wallets.length === 0) {
    console.log('No wallets found to process.');
    return;
  }

  const interval = 6 * 60 * 60 * 1000 + 10 * 60 * 1000;

  function countdown() {
    let remainingTime = interval;
    const countdownInterval = setInterval(() => {
      remainingTime -= 1000;
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
      process.stdout.write(`\rNext processing in: ${hours}h ${minutes}m ${seconds}s`);
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  async function processAllWallets() {
    for (const wallet of wallets) {
      await processRequest(wallet);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    countdown();
  }

  processAllWallets();
  setInterval(processAllWallets, interval);
}

startProcessingLoop();