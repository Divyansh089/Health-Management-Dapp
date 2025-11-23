require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, HOLESKY_RPC_URL, HOODI_RPC_URL, CHAIN_ID, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hoodi",
  networks: {
    holesky: {
      url: HOLESKY_RPC_URL || "https://rpc.ankr.com/eth_holesky",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    hoodi: {
      url: HOODI_RPC_URL || "https://ethereum-hoodi-rpc.publicnode.com",
      chainId: CHAIN_ID ? Number(CHAIN_ID) : 560048,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || ""
  }
};
