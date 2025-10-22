require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, HOLESKY_RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    holesky: {
      url: HOLESKY_RPC_URL || "https://rpc.ankr.com/eth_holesky",
      accounts: (PRIVATE_KEY && PRIVATE_KEY.length >= 64) ? [PRIVATE_KEY] : []
    }
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || "" }
};
