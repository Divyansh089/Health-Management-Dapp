import { useWeb3 } from "../state/Web3Provider.jsx";

export function useContract() {
  return useWeb3().signerContract;
}

export function useReadonlyContract() {
  return useWeb3().readonlyContract;
}
