import { ethers } from "ethers";
import { formatEntityId } from "./format.js";
import { fetchFromIPFS } from "./ipfs.js";
function resolveIpfsUri(uri) {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return `https://ipfs.io/ipfs/${uri}`;
}

function toNumber(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

export function formatEther(valueWei) {
  try {
    return Number(ethers.formatEther(valueWei));
  } catch {
    return 0;
  }
}

export async function fetchDoctors(contract, { onlyApproved = false } = {}) {
  if (!contract) return [];
  const total = toNumber(await contract.doctorCount());
  const result = [];
  for (let i = 1; i <= total; i += 1) {
    const row = await contract.doctors(i);
    const entry = {
      id: toNumber(row.id),
      account: row.account,
      ipfs: row.ipfs,
      approved: row.approved,
      appointments: toNumber(row.appointments),
      successes: toNumber(row.successes),
      displayName: null,
      photoUrl: null
    };
    entry.humanId = formatEntityId("DOC", entry.id);
    if (entry.ipfs) {
      try {
        const url = resolveIpfsUri(entry.ipfs);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const profile = await response.json();
            entry.displayName = profile?.name || profile?.fullName || profile?.displayName || null;
            const rawImage = profile?.image || profile?.avatar || profile?.photo || profile?.thumbnail || profile?.cover;
            if (rawImage && typeof rawImage === "object") {
              const nestedPointer =
                rawImage.gatewayUrl ||
                rawImage.url ||
                rawImage.ipfsUrl ||
                rawImage.src ||
                rawImage.href ||
                rawImage.cid ||
                rawImage.hash;
              entry.photoUrl = nestedPointer ? resolveIpfsUri(nestedPointer) : null;
            } else {
              entry.photoUrl = rawImage ? resolveIpfsUri(rawImage) : null;
            }
          }
        }
      } catch {
      }
    }
    if (!onlyApproved || entry.approved) {
      result.push(entry);
    }
  }
  return result;
}

export async function fetchPatients(contract) {
  if (!contract) return [];
  const total = toNumber(await contract.patientCount());
  const result = [];
  for (let i = 1; i <= total; i += 1) {
    const row = await contract.patients(i);
    const entry = {
      id: toNumber(row.id),
      account: row.account,
      ipfs: row.ipfs
    };
    entry.humanId = formatEntityId("PAT", entry.id);
    entry.displayName = null;
    if (entry.ipfs) {
      try {
        const url = resolveIpfsUri(entry.ipfs);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const profile = await response.json();
            entry.displayName = profile?.name || profile?.fullName || null;
          }
        }
      } catch {
      }
    }
    result.push(entry);
  }
  return result;
}

export async function fetchMedicines(contract, { includeInactive = true } = {}) {
  if (!contract) return [];
  const total = toNumber(await contract.medicineCount());
  const result = [];
  for (let i = 1; i <= total; i += 1) {
    const row = await contract.medicines(i);
    const entry = {
      id: toNumber(row.id),
      ipfs: row.ipfs,
      priceEth: formatEther(row.priceWei),
      priceWei: row.priceWei,
      stock: toNumber(row.stock),
      active: row.active,
      displayName: null,
      genericName: null,
      manufacturer: null,
      description: null,
      dosageForm: null,
      strength: null,
      storage: [],
      ingredients: [],
      imageUrl: null,
      metadata: null
    };
    entry.humanId = formatEntityId("MED", entry.id);
    if (entry.ipfs) {
      try {
        const url = resolveIpfsUri(entry.ipfs);
        if (url) {
          const response = await fetch(url);
          if (response.ok) {
            const metadata = await response.json();
            entry.metadata = metadata || null;
            entry.displayName = metadata?.name || metadata?.title || metadata?.medicineName || metadata?.productName || null;
            entry.genericName = metadata?.genericName || metadata?.generic || metadata?.generic_name || null;
            entry.manufacturer = metadata?.manufacturer || metadata?.maker || metadata?.brand || null;
            entry.description = metadata?.description || metadata?.summary || metadata?.notes || null;
            entry.dosageForm = metadata?.dosageForm || metadata?.form || null;
            entry.strength = metadata?.strength || metadata?.dose || null;
            const storageRaw = metadata?.storage || metadata?.storageConditions || metadata?.storageNotes || metadata?.storage_requirements;
            if (Array.isArray(storageRaw)) {
              entry.storage = storageRaw.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
            } else if (typeof storageRaw === "string") {
              entry.storage = storageRaw
                .split(/\r?\n|[.;]/)
                .map((item) => item.trim())
                .filter(Boolean);
            }
            const ingredientsRaw = metadata?.ingredients || metadata?.activeIngredients || metadata?.composition;
            if (Array.isArray(ingredientsRaw)) {
              entry.ingredients = ingredientsRaw.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim());
            }
            const rawImage = metadata?.image || metadata?.imageUrl || metadata?.thumbnail || metadata?.cover;
            if (rawImage && typeof rawImage === "object") {
              const nestedPointer =
                rawImage.gatewayUrl ||
                rawImage.url ||
                rawImage.ipfsUrl ||
                rawImage.src ||
                rawImage.href ||
                rawImage.cid ||
                rawImage.hash;
              entry.imageUrl = nestedPointer ? resolveIpfsUri(nestedPointer) : null;
            } else {
              entry.imageUrl = rawImage ? resolveIpfsUri(rawImage) : null;
            }
          } else {
            // Skip medicines with HTTP errors (500, 404, etc.)
            console.log(`Skipping medicine ID ${entry.id} due to IPFS HTTP error: ${response.status}`);
            continue;
          }
        }
      } catch (error) {
        // Skip medicines with broken IPFS links (500 errors, network errors, etc.)
        console.log(`Skipping medicine ID ${entry.id} due to IPFS error:`, error.message);
        continue; // Skip this medicine entirely
      }
    }
    if (includeInactive || entry.active) {
      result.push(entry);
    }
  }
  return result;
}

export async function fetchAppointmentsByDoctor(contract, doctorId) {
  if (!contract || !doctorId) return [];
  const appointments = await contract.getAppointmentsByDoctor(doctorId);
  return appointments.map((a) => ({
    id: toNumber(a.id),
    patientId: toNumber(a.patientId),
    doctorId: toNumber(a.doctorId),
    startAt: toNumber(a.startAt),
    open: a.open
  }));
}

export async function fetchAppointmentsByPatient(contract, patientId) {
  if (!contract || !patientId) return [];
  const appointments = await contract.getAppointmentsByPatient(patientId);
  return appointments.map((a) => ({
    id: toNumber(a.id),
    patientId: toNumber(a.patientId),
    doctorId: toNumber(a.doctorId),
    startAt: toNumber(a.startAt),
    open: a.open
  }));
}

export async function fetchAllAppointments(contract) {
  if (!contract) return [];
  const total = toNumber(await contract.appointmentCount());
  const result = [];
  for (let i = 1; i <= total; i += 1) {
    const row = await contract.appointments(i);
    result.push({
      id: toNumber(row.id),
      patientId: toNumber(row.patientId),
      doctorId: toNumber(row.doctorId),
      startAt: toNumber(row.startAt),
      open: row.open
    });
  }
  return result;
}

export async function fetchAllPrescriptions(contract) {
  if (!contract) return [];
  const total = toNumber(await contract.prescriptionCount());
  const result = [];
  for (let i = 1; i <= total; i += 1) {
    const row = await contract.prescriptions(i);
    result.push({
      id: toNumber(row.id),
      medicineId: toNumber(row.medicineId),
      patientId: toNumber(row.patientId),
      doctorId: toNumber(row.doctorId),
      date: toNumber(row.date)
    });
  }
  return result;
}
export async function fetchMedicineRequests(contract) {
  if (!contract) return [];
  const rows = await contract.getMedicineRequestsAll();
  return Promise.all(
    rows.map(async (row) => {
      const entry = {
        id: toNumber(row.id),
        doctorId: toNumber(row.doctorId),
        metadataCid: row.metadataCid || "",
        createdAt: toNumber(row.createdAt) * 1000,
        processed: Boolean(row.processed),
        metadata: null
      };
      if (entry.metadataCid) {
        try {
          entry.metadata = await fetchFromIPFS(entry.metadataCid);
        } catch (error) {
          console.warn("Failed to fetch medicine request metadata:", error);
        }
      }
      return entry;
    })
  );
}
function normalizeChatRow(row) {
  return {
    id: toNumber(row.id),
    appointmentId: toNumber(row.appointmentId),
    patientId: toNumber(row.patientId),
    doctorId: toNumber(row.doctorId),
    createdAt: toNumber(row.createdAt) * 1000,
    lastMessageAt: toNumber(row.lastMessageAt) * 1000,
    closed: Boolean(row.closed),
    metadataCid: row.metadataCid || row.metadata || ""
  };
}

export async function fetchChatsByDoctor(contract, doctorId) {
  if (!contract || !doctorId) return [];
  const rows = await contract.getChatsByDoctor(doctorId);
  return Promise.all(
    rows.map(async (row) => {
      const chat = normalizeChatRow(row);
      if (chat.metadataCid) {
        try {
          chat.metadata = await fetchFromIPFS(chat.metadataCid);
        } catch (error) {
          console.warn("Chat metadata fetch failed:", error);
          chat.metadata = null;
        }
      }
      return chat;
    })
  );
}

export async function fetchChatsByPatient(contract, patientId) {
  if (!contract || !patientId) return [];
  const rows = await contract.getChatsByPatient(patientId);
  return Promise.all(
    rows.map(async (row) => {
      const chat = normalizeChatRow(row);
      if (chat.metadataCid) {
        try {
          chat.metadata = await fetchFromIPFS(chat.metadataCid);
        } catch (error) {
          console.warn("Chat metadata fetch failed:", error);
          chat.metadata = null;
        }
      }
      return chat;
    })
  );
}

export async function fetchChatMessages(contract, chatId) {
  if (!contract || !chatId) {
    console.warn("[fetchChatMessages] Missing contract or chatId", { contract: !!contract, chatId });
    return [];
  }
  
  console.debug("[fetchChatMessages] Starting fetch", { 
    chatId, 
    contractAddress: contract.target || contract.address,
    hasFilters: !!contract.filters,
    hasChatMessageLoggedFilter: !!contract.filters?.ChatMessageLogged
  });
  
  try {
    // Check if the contract has the required filter
    if (!contract.filters?.ChatMessageLogged) {
      console.error("[fetchChatMessages] Contract missing ChatMessageLogged filter");
      return [];
    }

    const filter = contract.filters.ChatMessageLogged(BigInt(chatId));
    console.debug("[fetchChatMessages] Created filter", { 
      chatId, 
      filterTopics: filter.topics,
      filterAddress: filter.address 
    });
    
    const provider = contract.provider;
    if (!provider) {
      console.error("[fetchChatMessages] No provider available");
      return [];
    }

    let endBlock;
    try {
      endBlock = await provider.getBlockNumber();
      console.debug("[fetchChatMessages] Got latest block", { endBlock });
    } catch (error) {
      console.error("[fetchChatMessages] Failed to get block number", error);
      return [];
    }
    
    // Start from a reasonable range - look back 10000 blocks
    let startBlock = Math.max(0, endBlock - 10000);
    const logs = [];
    console.debug("[fetchChatMessages] Starting log search", { chatId, startBlock, endBlock });

    // Try to fetch all logs in chunks
    let currentStart = startBlock;
    while (currentStart <= endBlock) {
      const currentEnd = Math.min(currentStart + 1000, endBlock);
      
      try {
        console.debug("[fetchChatMessages] Fetching log chunk", { 
          chatId, 
          fromBlock: currentStart, 
          toBlock: currentEnd 
        });
        
        const chunk = await provider.getLogs({
          address: contract.target || contract.address,
          topics: filter.topics,
          fromBlock: currentStart,
          toBlock: currentEnd
        });
        
        logs.push(...chunk);
        console.debug("[fetchChatMessages] Got chunk", { 
          chatId, 
          chunkSize: chunk.length, 
          totalLogs: logs.length 
        });
        
        currentStart = currentEnd + 1;
        
      } catch (error) {
        console.error("[fetchChatMessages] Log fetch error for chunk", { 
          chatId, 
          fromBlock: currentStart, 
          toBlock: currentEnd, 
          error: error.message 
        });
        
        // If this fails, try a smaller range
        if (currentEnd === currentStart) {
          // Can't get smaller, skip this block
          currentStart += 1;
        } else {
          // Reduce chunk size
          const newChunkSize = Math.max(1, Math.floor((currentEnd - currentStart + 1) / 2));
          currentStart = Math.min(currentStart + newChunkSize, currentEnd + 1);
        }
      }
    }

    console.debug("[fetchChatMessages] Total logs collected", { chatId, logCount: logs.length });

    if (logs.length === 0) {
      console.warn("[fetchChatMessages] No logs found for chat", { chatId });
      return [];
    }

    // Parse the events
    const events = [];
    for (const log of logs) {
      try {
        const event = contract.interface.parseLog(log);
        events.push(event);
        console.debug("[fetchChatMessages] Parsed event", { 
          chatId, 
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          eventArgs: event.args 
        });
      } catch (parseError) {
        console.warn("[fetchChatMessages] Failed to parse log", { 
          chatId, 
          logTxHash: log.transactionHash,
          error: parseError.message 
        });
      }
    }
    
    console.debug("[fetchChatMessages] Parsed events", { chatId, eventCount: events.length });

    // Process messages with improved error handling
    const messages = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const { chatId: idArg, sender, messageCid, timestamp } = event.args || {};
      
      console.debug("[fetchChatMessages] Processing event", { 
        chatId, 
        eventIndex: i, 
        sender, 
        messageCid, 
        timestamp: toNumber(timestamp),
        idArg: toNumber(idArg)
      });
      
      let payload = null;
      if (messageCid) {
        try {
          console.debug("[fetchChatMessages] Fetching IPFS content", { chatId, messageCid });
          payload = await fetchFromIPFS(messageCid);
          console.debug("[fetchChatMessages] IPFS content loaded", { 
            chatId, 
            messageCid, 
            payloadType: typeof payload,
            hasText: !!(payload?.body?.text || payload?.text)
          });
        } catch (error) {
          console.warn("[fetchChatMessages] IPFS fetch failed", { 
            chatId, 
            messageCid, 
            error: error.message 
          });
          // Continue without payload - we'll show the CID as fallback
        }
      }
      
      const message = {
        id: `${event.transactionHash}-${event.logIndex}`,
        chatId: toNumber(idArg),
        sender: sender?.toLowerCase?.() || sender,
        cid: messageCid,
        payload,
        createdAt: toNumber(timestamp) * 1000 || Date.now()
      };
      
      messages.push(message);
      console.debug("[fetchChatMessages] Created message", { 
        chatId, 
        messageId: message.id, 
        sender: message.sender, 
        hasPayload: !!message.payload,
        createdAt: message.createdAt
      });
    }
    
    const sortedMessages = messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    console.debug("[fetchChatMessages] Final result", { 
      chatId, 
      messageCount: sortedMessages.length,
      messages: sortedMessages.map(m => ({
        id: m.id,
        sender: m.sender,
        hasPayload: !!m.payload,
        createdAt: m.createdAt
      }))
    });
    
    return sortedMessages;
  } catch (error) {
    console.error("[fetchChatMessages] Fatal error", { 
      chatId, 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}
