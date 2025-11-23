const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("Healthcare");
  const c = await Factory.deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  console.log("Healthcare deployed:", address);

  // optional verify on supported explorers (holesky or hoodi)
  if ((hre.network.name === "holesky" || hre.network.name === "hoodi") && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying on Etherscan-compatible explorer...");
    await new Promise(r => setTimeout(r, 30_000));
    try {
      await hre.run("verify:verify", { address, constructorArguments: [] });
    } catch (err) {
      console.warn("Verification failed:", err.message || err);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
