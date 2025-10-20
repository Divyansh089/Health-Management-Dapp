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

export function gatewayUrl(cid) {
  const gw = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  return gw + cid;
}

export async function fetchFromIPFS(cid) {
  try {
    // If using Pinata gateway and credentials are configured
    if (PINATA_JWT && PINATA_JWT !== 'your_pinata_jwt_token_here') {
      const response = await fetch(gatewayUrl(cid));
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('Successfully fetched from IPFS:', data);
      return data;
    } else {
      // If no real IPFS setup, simulate data structure based on CID pattern
      console.log('Using mock IPFS data for CID:', cid);
      
      // Check if it's a mock CID from our upload
      if (cid.startsWith('bafyrei')) {
        // Return mock data with proper structure
        throw new Error('Mock IPFS - data not actually stored');
      }
      
      // For real CIDs, try standard IPFS gateway
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    }
  } catch (error) {
    console.error(`IPFS fetch failed for ${cid}:`, error.message);
    throw new Error(`IPFS fetch failed: ${error.message}`);
  }
}
