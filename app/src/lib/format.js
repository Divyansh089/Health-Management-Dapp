
import { ethers } from "ethers";

export function formatEth(valueWei, { suffix = " ETH", digits = 4 } = {}) {
  if (valueWei === undefined || valueWei === null) return `0${suffix}`;
  try {
    const formatted = Number(ethers.formatEther(valueWei));
    return `${formatted.toFixed(digits)}${suffix}`;
  } catch {
    const numeric = typeof valueWei === "bigint" ? Number(valueWei) : Number(valueWei || 0);
    return `${(numeric / 1e18).toFixed(digits)}${suffix}`;
  }
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const value = Number(timestamp);
  const ms = value > 1e12 ? value : value * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function formatEntityId(prefix, id, pad = 4) {
  const numeric = Number(id ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return `${prefix}${"".padStart(pad, "-")}`;
  }
  const padded = String(Math.max(0, Math.trunc(numeric))).padStart(pad, "0");
  return `${prefix}${padded}`;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const raw = Number(timestamp);
  const ms = raw > 1e12 ? raw : raw * 1000;
  const now = Date.now();
  const diff = Math.max(0, now - ms);

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }
  return date.toLocaleDateString();
}

