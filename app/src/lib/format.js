
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

