import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useWeb3 } from "./Web3Provider.jsx";
import { formatEntityId } from "../lib/format.js";
import { formatEther } from "../lib/queries.js";

const NotificationContext = createContext(null);
let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `notif-${Date.now()}-${idCounter}`;
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const { readonlyContract, account } = useWeb3();
  const knownIdsRef = useRef(new Set());

  const addNotification = useCallback((entry) => {
    
    if (!entry || !entry.id) return;
    const known = knownIdsRef.current;
    if (known.has(entry.id)) return;
    known.add(entry.id);
    setItems((prev) => {
      if (prev.some((item) => item.id === entry.id)) return prev;
      const next = [entry, ...prev];
      return next.slice(0, 80);
    });
  }, []);

  const pushNotification = useCallback((input) => {
    if (!input) return null;
    const payload = typeof input === "string" ? { message: input } : input;

    const entry = {
      id: payload.id || nextId(),
      title: payload.title || "Update",
      message: payload.message || "",
      type: payload.type || "info",
      createdAt: payload.createdAt || Date.now(),
      read: Boolean(payload.read),
      actionLabel: payload.actionLabel,
      onAction: payload.onAction
    };

    addNotification(entry);
    return entry.id;
  }, [addNotification]);

  const markAsRead = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const removeNotification = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    if (!readonlyContract) return undefined;
    const contract = readonlyContract;
    const provider = contract.provider;
    const filter = contract.filters?.SystemActivity?.();
    if (!filter || !provider) return undefined;

    let cancelled = false;

    const tryNumber = (value) => {
      if (value === undefined || value === null) return 0;
      try {
        if (typeof value === "bigint") return Number(value);
        if (typeof value === "object" && "toNumber" in value) {
          return Number(value.toNumber());
        }
        return Number(value);
      } catch {
        return 0;
      }
    };

    const buildNotification = async (args, event) => {
      const [kind, refId, actor, patientId, doctorId, amountWei, data] = args;
      const kindNum = tryNumber(kind);
      const refNum = tryNumber(refId);
      const patientNum = tryNumber(patientId);
      const doctorNum = tryNumber(doctorId);
      const actorAddress = actor?.toLowerCase?.() || String(actor || "");
      const actorIsSelf = actorAddress && account && actorAddress === account.toLowerCase();
      const amountEth = Number(formatEther(amountWei || 0n)) || 0;
      const shortAmount = amountEth > 0 ? `${amountEth.toFixed(4)} ETH` : null;
      const dataString = data ? String(data) : "";

      let title = "Activity";
      let message = "";
      let type = "info";

      switch (kindNum) {
        case 1:
          title = "Doctor Registered";
          message = `Doctor ${formatEntityId("DOC", doctorNum || refNum)} registered (${shortenAddress(actorAddress)}).`;
          break;
        case 2:
          title = "Patient Registered";
          message = `Patient ${formatEntityId("PAT", patientNum || refNum)} joined the network.`;
          break;
        case 3:
          title = "Appointment Booked";
          message = `Appointment ${formatEntityId("APT", refNum)} booked by ${formatEntityId("PAT", patientNum)} for ${formatEntityId("DOC", doctorNum)}${shortAmount ? ` (${shortAmount})` : ""}.`;
          break;
        case 4:
          title = "Appointment Completed";
          message = `Appointment ${formatEntityId("APT", refNum)} marked completed by ${shortenAddress(actorAddress)}.`;
          break;
        case 5:
          title = "Medicine Added";
          message = `Medicine ${formatEntityId("MED", refNum)} listed${dataString ? ` (cid: ${shortCid(dataString)})` : ""}.`;
          type = "success";
          break;
        case 6:
          title = "Medicine Updated";
          message = `Medicine ${formatEntityId("MED", refNum)} updated (${dataString || "details changed"}).`;
          break;
        case 7:
          title = "Medicine Purchased";
          message = `${formatEntityId("PAT", patientNum)} bought medicine ${formatEntityId("MED", refNum)}${shortAmount ? ` for ${shortAmount}` : ""}.`;
          type = "success";
          break;
        case 8:
          title = "Chat Started";
          message = `Chat ${formatEntityId("CHAT", refNum)} opened for ${formatEntityId("PAT", patientNum)} ↔ ${formatEntityId("DOC", doctorNum)}.`;
          break;
        case 9:
          title = "Chat Message";
          message = `New chat message in ${formatEntityId("CHAT", refNum)} (${shortCid(dataString)}).`;
          break;
        case 10:
          title = "Chat Closed";
          message = `Chat ${formatEntityId("CHAT", refNum)} closed by ${shortenAddress(actorAddress)}.`;
          break;
        case 11:
          title = "Prescription Issued";
          message = `Prescription ${formatEntityId("RX", refNum)} for ${formatEntityId("PAT", patientNum)} (duration ≥ 3 days).`;
          type = "success";
          break;
        case 12:
          title = "Medicine Request";
          message = `Doctor ${formatEntityId("DOC", doctorNum)} submitted request ${formatEntityId("REQ", refNum)} (${shortCid(dataString)}).`;
          break;
        case 13: {
          title = "Medicine Request Status";
          const status = dataString?.length ? dataString : "updated";
          message = `Request ${formatEntityId("REQ", refNum)} marked ${status}.`;
          break;
        }
        case 14:
          title = "Platform Updated";
          message = `Platform settings updated (${dataString || "configuration"}).`;
          break;
        default:
          message = `Activity ${kindNum} recorded.`;
      }

      let createdAt = Date.now();
      try {
        const block = await event.getBlock();
        if (block?.timestamp) {
          createdAt = Number(block.timestamp) * 1000;
        }
      } catch {
        // ignore - fallback to Date.now()
      }

      return {
        id: `${event.transactionHash}-${event.logIndex}`,
        title,
        message,
        type,
        createdAt,
        read: actorIsSelf,
        metadata: {
          kind: kindNum,
          refId: refNum,
          patientId: patientNum,
          doctorId: doctorNum,
          actor: actorAddress,
          amountEth: amountEth,
          data: dataString
        }
      };
    };

    const bootstrap = async () => {
      try {
        const latest = await provider.getBlockNumber();
        const from = latest > 20000 ? latest - 20000 : 0;
        const logs = await contract.queryFilter(filter, from, latest);
        const recent = logs.slice(-60);
        for (const log of recent) {
          if (cancelled) return;
          const note = await buildNotification(log.args, log);
          addNotification(note);
        }
      } catch (error) {
        console.error("Failed to bootstrap notifications:", error);
      }
    };

    bootstrap();

    const listener = async (...eventArgs) => {
      const event = eventArgs[eventArgs.length - 1];
      try {
        const note = await buildNotification(eventArgs.slice(0, -1), event);
        addNotification(note);
      } catch (error) {
        console.error("Notification listener error:", error);
      }
    };

    contract.on(filter, listener);

    return () => {
      cancelled = true;
      contract.off(filter, listener);
    };
  }, [readonlyContract, account, addNotification]);
  const value = useMemo(
    () => ({
      items,
      unreadCount: items.filter((item) => !item.read).length,
      pushNotification,
      markAsRead,
      markAllRead,
      removeNotification,
      clear
    }),
    [items, pushNotification, markAsRead, markAllRead, removeNotification, clear]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}

function shortenAddress(value) {
  if (!value) return "";
  const address = value.toLowerCase();
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortCid(data) {
  if (!data) return "";
  const str = String(data);
  if (str.length <= 18) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}
