/**
 * Makes the cached bus stop and service lists available app-wide.
 *
 * Without this, every screen calling useBusDatabase() would trigger its
 * own download and hold its own copy of ~5,000 stops in memory. The
 * datasets are fetched once at startup and shared from here.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useBusDatabase, type BusDatabase } from '../hooks/useBusDatabase';

const BusDataContext = createContext<BusDatabase | null>(null);

export function BusDataProvider({ children }: { children: ReactNode }) {
  const database = useBusDatabase();

  return (
    <BusDataContext.Provider value={database}>
      {children}
    </BusDataContext.Provider>
  );
}

/**
 * Access the shared bus datasets.
 * @throws when called outside BusDataProvider, which is a wiring mistake
 *         worth failing loudly on rather than silently returning empty
 *         data that looks like "no results found".
 */
export function useBusData(): BusDatabase {
  const context = useContext(BusDataContext);

  if (!context) {
    throw new Error('useBusData must be used inside a BusDataProvider.');
  }

  return context;
}
