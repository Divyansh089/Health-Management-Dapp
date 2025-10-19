import { ethers } from "ethers";
import { formatEntityId } from "./format.js";

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
      active: row.active
    };
    entry.humanId = formatEntityId("MED", entry.id);
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
