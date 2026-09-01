/**
 * Saved stops and services, persisted across launches.
 *
 * State lives here and is mirrored to AsyncStorage on every change. The
 * logic itself sits in utils/favourites so it can be tested without
 * mocking storage or rendering a provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  toggleFavourite as toggle,
  removeFavourite as remove,
  reorderFavourites as reorder,
  isFavourite as contains,
  type Favourite,
} from '../utils/favourites';

const STORAGE_KEY = 'favourites:v1';

interface FavouritesValue {
  favourites: Favourite[];
  /** False until the saved list has been read back from storage. */
  loaded: boolean;
  toggle: (favourite: Favourite) => void;
  remove: (key: string) => void;
  reorder: (from: number, to: number) => void;
  has: (favourite: Favourite) => boolean;
}

const FavouritesContext = createContext<FavouritesValue | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Read once on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) setFavourites(JSON.parse(raw) as Favourite[]);
      } catch {
        // Corrupt data: start empty rather than blocking the app.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Mirror every change back to storage.
  useEffect(() => {
    if (!loaded) return; // don't overwrite saved data with the initial []
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
  }, [favourites, loaded]);

  const value: FavouritesValue = {
    favourites,
    loaded,
    toggle: useCallback(
      (favourite: Favourite) =>
        setFavourites(current => toggle(current, favourite)),
      []
    ),
    remove: useCallback(
      (key: string) => setFavourites(current => remove(current, key)),
      []
    ),
    reorder: useCallback(
      (from: number, to: number) =>
        setFavourites(current => reorder(current, from, to)),
      []
    ),
    has: useCallback(
      (favourite: Favourite) => contains(favourites, favourite),
      [favourites]
    ),
  };

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesValue {
  const context = useContext(FavouritesContext);

  if (!context) {
    throw new Error('useFavourites must be used inside a FavouritesProvider.');
  }

  return context;
}
