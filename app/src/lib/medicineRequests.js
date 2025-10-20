const STORAGE_KEY = "hmdapp:medicine-requests";
export const MEDICINE_REQUESTS_EVENT = "medicine-requests:changed";

let memoryStore = [];

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
  return {
    id: Number.isFinite(Number(entry.id)) ? Number(entry.id) : null,
    doctorId: entry.doctorId ?? null,
    doctorAddress: entry.doctorAddress || null,
    doctorName: entry.doctorName || null,
    medicineName: entry.medicineName || entry.name || "",
    genericName: entry.genericName || "",
    manufacturer: entry.manufacturer || "",
    description: entry.description || "",
    activeIngredients: Array.isArray(entry.activeIngredients) ? entry.activeIngredients : [],
    strength: entry.strength || "",
    dosageForm: entry.dosageForm || "",
    therapeuticClass: entry.therapeuticClass || "",
    approvalNumber: entry.approvalNumber || "",
    expiryDate: entry.expiryDate || "",
    batchNumber: entry.batchNumber || "",
    price: entry.price ?? null,
    currency: entry.currency || "USD",
    urgencyLevel: entry.urgencyLevel || "normal",
    requestReason: entry.requestReason || "",
    requestDate,
    status: entry.status || "pending",
    ipfsCid: entry.ipfsCid || entry.cid || null,
    ipfsUrl: entry.ipfsUrl || entry.gatewayUrl || null,
    metadata: entry.metadata || null,
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
      return parsed
        .map(normalizeRequest)
        .filter(Boolean)
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
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
