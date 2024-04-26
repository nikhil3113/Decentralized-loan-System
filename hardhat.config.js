require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks:{
    sepolia: {
      url: process.env.Sepolia_url,
      accounts: [process.env.Sepolia_acc],
      chainId:11155111
    },
    localhost: {
      chainId: 31337,
    },
  }
};
