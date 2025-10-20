const fs = require("fs");
const path = require("path");

const CONTRACT_NAME = process.env.CONTRACT_NAME || "HealthcareLite";
const ADDRESS = process.env.LAST_DEPLOYED_ADDRESS;
if (!ADDRESS) throw new Error("Set LAST_DEPLOYED_ADDRESS=0x...");

const artifactsRoot = path.join(__dirname, "..", "artifacts", "contracts");
const outDir = path.join(__dirname, "..", "..", "app", "src", "abi");

// find artifact file named {CONTRACT_NAME}.json under artifacts/contracts/**/
function findArtifact(root, name) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      const candidate = path.join(p, `${name}.json`);
      if (fs.existsSync(candidate)) return candidate;
      const deeper = findArtifact(p, name);
      if (deeper) return deeper;
    }
  }
  return null;
}

const artifactPath = findArtifact(artifactsRoot, CONTRACT_NAME);
if (!artifactPath) {
  throw new Error(
    `Artifact for ${CONTRACT_NAME} not found under ${artifactsRoot}. ` +
    `Ensure it compiled, or set CONTRACT_NAME env.`
  );
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${CONTRACT_NAME}.json`), JSON.stringify(abi, null, 2));
fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify({ holesky: ADDRESS }, null, 2));

console.log(`Exported ABI -> app/src/abi/${CONTRACT_NAME}.json`);
console.log(`Exported address -> app/src/abi/addresses.json`);
