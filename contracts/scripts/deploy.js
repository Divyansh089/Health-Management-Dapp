const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("Healthcare");
  const c = await Factory.deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  console.log("Healthcare deployed:", address);

  // optional verify
  if (hre.network.name === "holesky" && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying on Etherscan...");
    await new Promise(r => setTimeout(r, 30_000));
    await hre.run("verify:verify", { address, constructorArguments: [] });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
