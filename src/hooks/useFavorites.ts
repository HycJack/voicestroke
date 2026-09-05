import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "voicestroke-favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggle = useCallback((char: string) => {
    setFavorites((prev) =>
      prev.includes(char) ? prev.filter((c) => c !== char) : [...prev, char]
    );
  }, []);

  const isFavorite = useCallback(
    (char: string) => favorites.includes(char),
    [favorites]
  );

  const clear = useCallback(() => setFavorites([]), []);

  return { favorites, toggle, isFavorite, clear };
}
