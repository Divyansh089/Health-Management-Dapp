import { createContext, useCallback, useContext, useMemo, useState } from "react";

const DEFAULT_PLACEHOLDER = "Search...";

const SearchContext = createContext({
  query: "",
  setQuery: () => {},
  clearQuery: () => {},
  placeholder: DEFAULT_PLACEHOLDER,
  setPlaceholder: () => {}
});

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholderState] = useState(DEFAULT_PLACEHOLDER);

  const handleSetQuery = useCallback((value) => {
    setQuery(value || "");
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
  }, []);

  const setPlaceholder = useCallback((value) => {
    setPlaceholderState(value && value.trim() ? value : DEFAULT_PLACEHOLDER);
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery: handleSetQuery,
      clearQuery,
      placeholder,
      setPlaceholder
    }),
    [query, handleSetQuery, clearQuery, placeholder, setPlaceholder]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
}
