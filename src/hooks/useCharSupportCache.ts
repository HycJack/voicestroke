import { useState, useCallback } from "react";

/** Tracks unsupported characters so we don't retry them. */
export function useCharSupportCache() {
  const [unsupported, setUnsupported] = useState<Set<string>>(new Set());

  const markUnsupported = useCallback((char: string) => {
    setUnsupported((prev) => new Set(prev).add(char));
  }, []);

  const isUnsupported = useCallback(
    (char: string) => unsupported.has(char),
    [unsupported]
  );

  return { markUnsupported, isUnsupported, unsupported };
}
