// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
//   console.log("Deploying contracts with the account:", deployer.address);

  const LoanSystem = await ethers.getContractFactory("LoanSystem");
  const loanSystem = await LoanSystem.deploy();

  console.log("LoanSystem deployed to:", loanSystem.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
