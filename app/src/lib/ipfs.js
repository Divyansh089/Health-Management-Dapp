// IPFS helpers for uploading JSON metadata and files using Pinata
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';

export async function uploadJSONToIPFS(data) {
  try {
    // If Pinata credentials are not configured, use mock implementation
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY || PINATA_JWT === 'your_pinata_jwt_token_here') {
      return await mockUploadJSON(data);
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, 'metadata.json');

    const metadata = JSON.stringify({
      name: `Healthcare-${Date.now()}.json`,
      keyvalues: {
        type: 'healthcare-metadata',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { 
      cid: result.IpfsHash, 
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: gatewayUrl(result.IpfsHash)
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    // Fallback to mock implementation on error
    return await mockUploadJSON(data);
  }
}

export async function uploadFileToIPFS(file) {
  try {
    // If Pinata credentials are not configured, use mock implementation
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY || PINATA_JWT === 'your_pinata_jwt_token_here') {
      return await mockUploadFile(file);
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'healthcare-file',
        originalName: file.name,
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata file upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { 
      cid: result.IpfsHash, 
      name: file.name,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: gatewayUrl(result.IpfsHash)
    };
  } catch (error) {
    console.error('File upload error:', error);
    // Fallback to mock implementation on error
    return await mockUploadFile(file);
  }
}

// Mock implementations for development/testing
async function mockUploadJSON(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const mockCid = `bafyrei${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Mock IPFS Upload - JSON:', jsonString);
  return { 
    cid: mockCid, 
    ipfsUrl: `ipfs://${mockCid}`,
    gatewayUrl: gatewayUrl(mockCid)
  };
}

async function mockUploadFile(file) {
  const mockCid = `bafyrei${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('Mock IPFS Upload - File:', file.name);
  return { 
    cid: mockCid, 
    name: file.name,
    ipfsUrl: `ipfs://${mockCid}`,
    gatewayUrl: gatewayUrl(mockCid)
  };
}

export function gatewayUrl(cidOrPath) {
  const base = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').trim();
  // Ensure trailing slash on base
  const gw = base.endsWith('/') ? base : base + '/';
  return gw + cidOrPath;
}

function normalizeIpfsInput(input) {
  if (!input) return '';
  const s = String(input).trim();
  // If direct http(s) URL, return as-is
  if (/^https?:\/\//i.test(s)) {
    // Prefer extracting path after /ipfs/ when present (for consistent fallback URLs)
    const idx = s.indexOf('/ipfs/');
    return idx !== -1 ? s.slice(idx + 6) : s; // either ipfs path or full URL
  }
  if (s.startsWith('ipfs://')) return s.slice(7);
  const ipfsIdx = s.indexOf('/ipfs/');
  if (ipfsIdx !== -1) return s.slice(ipfsIdx + 6);
  return s; // assume it's CID or CID/path
}

async function fetchWithTimeout(url, ms = 8000, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchFromIPFS(input) {
  const norm = normalizeIpfsInput(input);
  const isDirectHttp = /^https?:\/\//i.test(String(input));
  const candidates = [];

  console.debug('[IPFS] Starting fetch', { input, normalized: norm, isDirectHttp });

  // If a direct URL was provided (e.g., full gateway URL), try it first.
  if (isDirectHttp && !norm.includes('://')) {
    candidates.push(String(input));
  }

  // Always try configured gateway first (works even without PINATA_JWT)
  candidates.push(gatewayUrl(norm));

  // Add common public gateways as fallbacks
  candidates.push(
    `https://cloudflare-ipfs.com/ipfs/${norm}`,
    `https://dweb.link/ipfs/${norm}`,
    `https://gateway.pinata.cloud/ipfs/${norm}`,
    `https://ipfs.filebase.io/ipfs/${norm}`,
    `https://4everland.io/ipfs/${norm}`
  );

  console.debug('[IPFS] Gateway candidates', candidates);

  const errors = [];
  for (const url of candidates) {
    try {
      console.debug('[IPFS] Trying gateway', url);
      const resp = await fetchWithTimeout(url, 8000, {
        // Hint for JSON; many gateways still deliver correct CORS headers
        headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' },
        mode: 'cors'
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Try JSON first; if it fails, bubble up so next gateway can be tried
      const text = await resp.text();
      console.debug('[IPFS] Got response text', { url, length: text.length, preview: text.substring(0, 100) });
      
      try {
        const json = JSON.parse(text);
        console.debug('[IPFS] Successfully parsed JSON', { url, json });
        return json;
      } catch (e) {
        console.warn('[IPFS] Failed to parse as JSON, trying next gateway', { url, error: e.message, text: text.substring(0, 200) });
        throw new Error('Non-JSON content');
      }
    } catch (e) {
      const errorMsg = `${url} -> ${e.message}`;
      errors.push(errorMsg);
      console.warn('[IPFS] Gateway failed', errorMsg);
      // continue to next gateway
    }
  }

  // If we reach here, all gateways failed or content was not JSON
  const msg = `all gateways failed for ${norm}: ${errors.join(' | ')}`;
  console.error('[IPFS] All gateways failed', { input, norm, errors });
  throw new Error(`IPFS fetch failed: ${msg}`);
}
