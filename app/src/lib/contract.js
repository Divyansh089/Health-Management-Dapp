import { ethers } from "ethers";
import healthcareArtifact from "../abi/Healthcare.json";
import addresses from "../abi/addresses.json";
import { NETWORK } from "./constants.js";

const abi = healthcareArtifact;

let browserProvider = null;

function requireEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask (or compatible wallet) is required.");
  }
}

export function getProvider() {
  requireEthereum();
  if (!browserProvider) {
    browserProvider = new ethers.BrowserProvider(window.ethereum);
  }
  return browserProvider;
}

export function getContractAddress() {
  const address = addresses[NETWORK];
  if (!address) {
    throw new Error(`Missing contract address for network "${NETWORK}" in addresses.json`);
  }
  return address;
}

export async function getReadonlyContract() {
  const provider = getProvider();
  return new ethers.Contract(getContractAddress(), abi, provider);
}

export async function getSignerContract({ account, requestAccounts = false } = {}) {
  const provider = getProvider();
  let signer;

  if (account) {
    signer = await provider.getSigner(account);
  } else if (requestAccounts) {
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts.length) {
      throw new Error("Wallet connection rejected.");
    }
    signer = await provider.getSigner(accounts[0]);
  } else {
    const accounts = await provider.send("eth_accounts", []);
    if (!accounts.length) {
      throw new Error("Connect your wallet to continue.");
    }
    signer = await provider.getSigner(accounts[0]);
  }

  return new ethers.Contract(getContractAddress(), abi, signer);
}

export async function getAdminAddress() {
  const contract = await getReadonlyContract();
  return (await contract.admin()).toLowerCase();
}

// Backwards compatibility helpers (deprecated)
export async function getContract(options) {
  return getSignerContract(options);
}

export async function getReadonly() {
  return getReadonlyContract();
}
