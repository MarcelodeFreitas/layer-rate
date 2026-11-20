import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData } from "./schema";
import { getStorage, loadData, saveData } from "./storage";

export interface StoreValue {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  storageOk: boolean;
  recovered: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  children,
  storage,
}: {
  children: ReactNode;
  storage?: Storage | null;
}) {
  const storageToUse = useMemo(
    () => (storage === undefined ? getStorage() : storage),
    [storage],
  );
  const [initial] = useState(() => loadData(storageToUse));
  const [data, setData] = useState(initial.data);
  const [storageOk, setStorageOk] = useState(initial.storageOk);
  const [recovered] = useState(initial.recovered);
  const dataRef = useRef(data);
  dataRef.current = data;

  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      const next = fn(dataRef.current);
      dataRef.current = next;
      setData(next);
      if (storageToUse !== null && !saveData(storageToUse, next)) {
        setStorageOk(false);
      }
    },
    [storageToUse],
  );

  const value = useMemo(
    () => ({ data, update, storageOk, recovered }),
    [data, update, storageOk, recovered],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (ctx === null) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
