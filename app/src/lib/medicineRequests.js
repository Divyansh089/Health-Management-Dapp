const STORAGE_KEY = "hmdapp:medicine-requests";
export const MEDICINE_REQUESTS_EVENT = "medicine-requests:changed";

let memoryStore = [];

function resolveImagePointer(pointer) {
  if (!pointer) return null;
  if (typeof pointer === "object") {
    const nested =
      pointer.gatewayUrl ||
      pointer.url ||
      pointer.ipfsUrl ||
      pointer.cid ||
      pointer.hash ||
      pointer.src ||
      pointer.href ||
      null;
    return resolveImagePointer(nested);
  }
  if (typeof pointer !== "string") return null;
  const trimmed = pointer.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${trimmed.slice(7)}`;
  }
  if (trimmed.startsWith("http")) {
    return trimmed;
  }
  return `https://ipfs.io/ipfs/${trimmed}`;
}

function hasStorage() {
  try {
    return typeof window !== "undefined" && window.localStorage;
  } catch {
    return false;
  }
}

function normalizeRequest(entry) {
  if (!entry || typeof entry !== "object") return null;
  const now = new Date().toISOString();
  const requestDate = entry.requestDate || entry.createdAt || now;
  const updatedAt = entry.updatedAt || now;
  const numericPrice = Number(entry.price);
  const price = Number.isFinite(numericPrice) ? numericPrice : null;
  const numericStock = Number(entry.stock ?? entry.quantity);
  const stock = Number.isFinite(numericStock) ? numericStock : null;
  const batch = entry.batch ?? entry.batchNumber ?? "";
  const expiry = entry.expiry ?? entry.expiryDate ?? "";
  const regulatoryId = entry.regulatoryId ?? entry.approvalNumber ?? "";
  const storageRaw = entry.storage ?? entry.storageConditions ?? entry.storageNotes ?? "";
  const storage = Array.isArray(storageRaw)
    ? storageRaw
    : typeof storageRaw === "string"
    ? storageRaw
        .split(/\r?\n|[.;]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const ingredientsSource = Array.isArray(entry.ingredients)
    ? entry.ingredients
    : Array.isArray(entry.activeIngredients)
    ? entry.activeIngredients
    : [];
  const ingredients = ingredientsSource
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  const imageUrl = resolveImagePointer(entry.image || entry.imageUrl || entry.thumbnail || entry.cover || null);
  return {
    id: Number.isFinite(Number(entry.id)) ? Number(entry.id) : null,
    doctorId: entry.doctorId ?? null,
    doctorAddress: entry.doctorAddress || null,
    doctorName: entry.doctorName || null,
    medicineName: entry.medicineName || entry.name || "",
    genericName: entry.genericName || "",
    manufacturer: entry.manufacturer || "",
    description: entry.description || "",
    strength: entry.strength || "",
    dosageForm: entry.dosageForm || "",
    therapeuticClass: entry.therapeuticClass || "",
    regulatoryId,
    expiry,
    batch,
    storage,
    ingredients,
  activeIngredients: ingredients,
    price,
    currency: entry.currency || "ETH",
    stock,
    urgencyLevel: entry.urgencyLevel || "normal",
    requestReason: entry.requestReason || "",
    requestDate,
    status: entry.status || "pending",
    ipfsCid: entry.ipfsCid || entry.cid || null,
    ipfsUrl: entry.ipfsUrl || entry.gatewayUrl || null,
    metadata: entry.metadata || null,
    clientRequestId: entry.clientRequestId || entry.signature || null,
  image: imageUrl,
  imageUrl,
    createdAt: entry.createdAt || requestDate,
    updatedAt,
    processedAt: entry.processedAt || null,
    txHash: entry.txHash || null
  };
}

function readFromStorage() {
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const normalized = parsed
        .map(normalizeRequest)
        .filter(Boolean)
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

      const seen = new Set();
      const unique = [];
      for (const item of normalized) {
        const key =
          item.clientRequestId ||
          (item.ipfsCid ? `cid:${item.ipfsCid}` : null) ||
          (item.id !== null ? `id:${item.id}` : `${item.doctorId ?? "?"}:${item.requestDate}:${item.medicineName}`);
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        unique.push(item);
      }
      return unique;
    } catch {
      return [];
    }
  }
  return memoryStore.slice();
}

function writeToStorage(list) {
  const payload = Array.isArray(list) ? list.filter(Boolean) : [];
  if (hasStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore write errors
    }
  } else {
    memoryStore = payload.slice();
  }

  if (typeof window !== "undefined") {
    try {
      const event = new CustomEvent(MEDICINE_REQUESTS_EVENT, { detail: { requests: payload } });
      window.dispatchEvent(event);
    } catch {
      // ignore dispatch errors
    }
  }
}

export function getMedicineRequests() {
  return readFromStorage();
}

function nextId(existing) {
  const maxId = existing.reduce((acc, item) => {
    const value = Number(item?.id);
    return Number.isFinite(value) && value > acc ? value : acc;
  }, 0);
  return maxId + 1;
}

export function addMedicineRequest(input) {
  const current = readFromStorage();
  const now = new Date().toISOString();
  const base = normalizeRequest({ ...input, createdAt: now, requestDate: now, updatedAt: now });
  if (!base) throw new Error("Invalid request payload");
  const duplicate = current.find((item) => {
    if (base.clientRequestId && item.clientRequestId === base.clientRequestId) return true;
    if (base.ipfsCid && item.ipfsCid === base.ipfsCid) return true;
    return false;
  });
  if (duplicate) {
    const merged = { ...duplicate, ...base, id: duplicate.id ?? base.id };
    const nextMerged = current.map((item) => (item === duplicate ? merged : item));
    writeToStorage(nextMerged);
    return merged;
  }
  base.id = base.id ?? nextId(current);
  const next = [base, ...current.filter((item) => item.id !== base.id)];
  writeToStorage(next);
  return base;
}

export function updateMedicineRequest(id, updates) {
  const current = readFromStorage();
  let updated = null;
  const next = current.map((item) => {
    if (item.id !== id) return item;
    const patch = typeof updates === "function" ? updates(item) : updates;
    const merged = normalizeRequest({ ...item, ...patch, updatedAt: new Date().toISOString() });
    updated = merged;
    return merged;
  });
  if (!updated) return null;
  writeToStorage(next);
  return updated;
}

export function clearMedicineRequests() {
  writeToStorage([]);
}
