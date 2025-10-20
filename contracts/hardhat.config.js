require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, HOLESKY_RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    holesky: {
      url: HOLESKY_RPC_URL || "https://rpc.ankr.com/eth_holesky",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || "" }
};
