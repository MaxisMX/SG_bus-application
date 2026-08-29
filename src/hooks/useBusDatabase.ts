/**
 * Loads the static bus stop and service datasets, from cache when
 * possible and from the network on first launch.
 *
 * The download is the slowest thing the app ever does (~11 requests for
 * stops alone), so progress is reported back to the UI rather than
 * leaving the user on a blank screen wondering if it has hung.
 */

import { useCallback, useEffect, useState } from 'react';
import { getAllBusStops, getAllBusServices } from '../utils/__tests__/lta';
import { readCache, writeCache, CacheKey } from '../services/storage';
import type { BusStop, BusService } from '../types/lta';

export type DatabaseStatus =
  | 'idle'
  | 'loading-cache'
  | 'downloading'
  | 'ready'
  | 'error';

export interface BusDatabase {
  status: DatabaseStatus;
  stops: BusStop[];
  services: BusService[];
  /** Records fetched so far, for a progress readout. */
  progress: number;
  /** True when data came from the device rather than the network. */
  fromCache: boolean;
  error: string | null;
  /** Force a fresh download, for a Settings "refresh data" button. */
  refresh: () => Promise<void>;
}

export function useBusDatabase(): BusDatabase {
  const [status, setStatus] = useState<DatabaseStatus>('idle');
  const [stops, setStops] = useState<BusStop[]>([]);
  const [services, setServices] = useState<BusService[]>([]);
  const [progress, setProgress] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @param force skip the cache and go straight to the network
   */
  const load = useCallback(async (force = false) => {
    setError(null);

    if (!force) {
      setStatus('loading-cache');

      const [cachedStops, cachedServices] = await Promise.all([
        readCache<BusStop[]>(CacheKey.BusStops),
        readCache<BusService[]>(CacheKey.BusServices),
      ]);

      if (cachedStops?.length && cachedServices?.length) {
        setStops(cachedStops);
        setServices(cachedServices);
        setFromCache(true);
        setStatus('ready');
        return;
      }
    }

    try {
      setStatus('downloading');
      setProgress(0);
      setFromCache(false);

      // Sequential rather than parallel: LTA rate-limits, and stops are
      // the larger and more urgent of the two datasets.
      const freshStops = await getAllBusStops(setProgress);
      const freshServices = await getAllBusServices(
        loaded => setProgress(freshStops.length + loaded)
      );

      setStops(freshStops);
      setServices(freshServices);

      // Cache after state is set so the UI unblocks first.
      await Promise.all([
        writeCache(CacheKey.BusStops, freshStops),
        writeCache(CacheKey.BusServices, freshServices),
      ]);

      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bus data.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { status, stops, services, progress, fromCache, error, refresh };
}
