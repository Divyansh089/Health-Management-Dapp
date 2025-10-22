import { ethers } from "ethers";
import { formatEntityId } from "./format.js";
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
      successes: toNumber(row.successes)
    };
    entry.humanId = formatEntityId("DOC", entry.id);
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
