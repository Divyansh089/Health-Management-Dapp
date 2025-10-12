// Placeholder IPFS helpers (to be replaced with real pinning service integration)
export async function uploadToIPFS(file) {
  // TODO integrate web3.storage, pinata, lighthouse, etc.
  return { cid: 'bafy...placeholder', name: file.name };
}

export function gatewayUrl(cid) {
  const gw = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  return gw + cid;
}
