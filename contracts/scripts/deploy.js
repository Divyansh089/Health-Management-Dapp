const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log(`Network: ${network.name}`);
  console.log("Deploying Healthcare contract...");
  const Healthcare = await ethers.getContractFactory("Healthcare");
  const healthcare = await Healthcare.deploy();
  await healthcare.deployed();
  console.log("Healthcare deployed at:", healthcare.address);

  // Fetch block info
  const receipt = await healthcare.deploymentTransaction().wait();
  const block = await ethers.provider.getBlock(receipt.blockNumber);

  // Prepare deployment metadata
  const metadata = {
    address: healthcare.address,
    network: network.name,
    blockNumber: receipt.blockNumber,
    timestamp: block.timestamp
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const fileName = `${network.name}-Healthcare.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  console.log(`Deployment metadata written to deployments/${fileName}`);

  return metadata;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
