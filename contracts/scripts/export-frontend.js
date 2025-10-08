// Copy ABI + deployed address into ../app/src/abi
// Run after deployment.

const fs = require('fs');
const path = require('path');

async function run() {
  const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts', 'Healthcare.sol');
  const artifactFile = path.join(artifactsDir, 'Healthcare.json');
  if (!fs.existsSync(artifactFile)) {
    console.error('Artifact not found. Did you run hardhat compile?');
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf-8'));

  // Expect deployment info in deployments/holesky-Healthcare.json (you can adapt to your flow)
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const deploymentFile = path.join(deploymentsDir, 'holesky-Healthcare.json');
  if (!fs.existsSync(deploymentFile)) {
    console.error('Deployment file not found. Create it or adjust script.');
    process.exit(1);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf-8'));

  const targetDir = path.join(__dirname, '..', '..', 'app', 'src', 'abi');
  fs.mkdirSync(targetDir, { recursive: true });

  fs.writeFileSync(path.join(targetDir, 'Healthcare.abi.json'), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(targetDir, 'Healthcare.address.json'), JSON.stringify({ address: deployment.address, network: 'holesky' }, null, 2));

  console.log('Exported ABI & address to app/src/abi');
}

run();
