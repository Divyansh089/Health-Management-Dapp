import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_ADMIN_ADDRESS, ROLES } from "../lib/constants.js";
import {
  getAdminAddress,
  getProvider,
  getReadonlyContract,
  getSignerContract
} from "../lib/contract.js";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [readonlyContract, setReadonlyContract] = useState(null);
  const [signerContract, setSignerContract] = useState(null);

  // Load readonly contract as soon as a wallet provider exists
  useEffect(() => {
    let ignore = false;
    async function initReadonly() {
      try {
        const contract = await getReadonlyContract();
        if (!ignore) setReadonlyContract(contract);
      } catch (err) {
        if (!ignore) setConnectError(err);
      }
    }
    try {
      getProvider();
      initReadonly();
    } catch (err) {
      setConnectError(err);
    }

    return () => {
      ignore = true;
    };
  }, []);

  // Detect already connected account on mount and watch for changes
  useEffect(() => {
    try {
      const provider = getProvider();
      provider
        .send("eth_accounts", [])
        .then((accounts) => {
          if (accounts.length) {
            setAccount(accounts[0].toLowerCase());
          }
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts) => {
        const next = accounts?.[0] ? accounts[0].toLowerCase() : null;
        const prevAccount = account;
        
        setAccount(next);
        queryClient.invalidateQueries({ queryKey: ["web3-role"] });
        queryClient.invalidateQueries({ queryKey: ["web3-admin"] });
        
        // Auto-redirect when wallet address changes
        if (prevAccount && next && prevAccount !== next) {
          // Wait for role to be updated, then redirect
          setTimeout(() => {
            window.location.href = '/'; // Redirect to home to re-evaluate role
          }, 1000);
        } else if (prevAccount && !next) {
          // Wallet disconnected, redirect to home
          window.location.href = '/';
        }
      };

      window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    } catch {
      // ignore when provider unavailable (handled above)
    }
  }, [queryClient, account]);

  // Keep signer-backed contract in sync with current account
  useEffect(() => {
    let ignore = false;
    async function loadSignerContract() {
      if (!account) {
        setSignerContract(null);
        return;
      }
      try {
        const contract = await getSignerContract({ account });
        if (!ignore) setSignerContract(contract);
      } catch (err) {
        if (!ignore) setConnectError(err);
        if (!ignore) setSignerContract(null);
      }
    }
    loadSignerContract();

    return () => {
      ignore = true;
    };
  }, [account]);

  const adminQuery = useQuery({
    queryKey: ["web3-admin"],
    enabled: !!readonlyContract,
    queryFn: async () => {
      try {
        const address = await getAdminAddress();
        return address?.toLowerCase?.() || DEFAULT_ADMIN_ADDRESS;
      } catch {
        return DEFAULT_ADMIN_ADDRESS;
      }
    },
    initialData: DEFAULT_ADMIN_ADDRESS,
    staleTime: 60_000
  });

  const roleQuery = useQuery({
    queryKey: ["web3-role", account],
    enabled: !!readonlyContract && !!account,
    queryFn: async () => {
      if (!account) return null;
      const normalizedAccount = account.toLowerCase();
      if (normalizedAccount === DEFAULT_ADMIN_ADDRESS) {
        return { role: ROLES.ADMIN, doctorId: null, patientId: null };
      }
      if (!readonlyContract) {
        return { role: null, doctorId: null, patientId: null };
      }
      const adminAddress = (
        await readonlyContract
          .admin()
          .then((addr) => addr?.toLowerCase?.())
          .catch(() => DEFAULT_ADMIN_ADDRESS)
      ).toLowerCase();
      if (adminAddress === normalizedAccount) {
        return { role: ROLES.ADMIN, doctorId: null, patientId: null };
      }

      const doctorId = Number(await readonlyContract.getDoctorId(normalizedAccount));
      if (doctorId > 0) {
        return { role: ROLES.DOCTOR, doctorId, patientId: null };
      }

      const patientId = Number(await readonlyContract.getPatientId(normalizedAccount));
      if (patientId > 0) {
        return { role: ROLES.PATIENT, doctorId: null, patientId };
      }

      return { role: null, doctorId: null, patientId: null };
    }
  });

  const connect = async () => {
    setConnectError(null);
    try {
      setIsConnecting(true);
      const contract = await getSignerContract({ requestAccounts: true });
      const signerAddr = (await contract.runner?.getAddress())?.toLowerCase();
      setSignerContract(contract);
      setAccount(signerAddr || null);
      queryClient.invalidateQueries({ queryKey: ["web3-role"] });
      queryClient.invalidateQueries({ queryKey: ["web3-admin"] });
    } catch (err) {
      setConnectError(err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSignerContract(null);
    setConnectError(null);
    queryClient.clear();
  };

  const value = useMemo(
    () => ({
      account,
      connect,
      disconnect,
      isConnecting,
      connectError,
      readonlyContract,
      signerContract,
      adminAddress: adminQuery.data || DEFAULT_ADMIN_ADDRESS,
      role: roleQuery.data?.role || null,
      doctorId: roleQuery.data?.doctorId || null,
      patientId: roleQuery.data?.patientId || null,
      isLoadingRole: roleQuery.isLoading,
      roleError: roleQuery.error || null,
      refreshRole: () => queryClient.invalidateQueries({ queryKey: ["web3-role"] })
    }),
    [
      account,
      connect,
      disconnect,
      isConnecting,
      connectError,
      readonlyContract,
      signerContract,
      adminQuery.data,
      roleQuery.data,
      roleQuery.isLoading,
      roleQuery.error,
      queryClient
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return ctx;
}
