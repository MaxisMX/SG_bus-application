/**
 * Loads the bus routes dataset on demand.
 *
 * Routes are roughly 26,000 records across ~53 paginated requests, which
 * is far heavier than stops and services. Downloading it during first
 * launch would turn a few seconds of setup into close to a minute, so it
 * is deferred until the user first opens a route view. After that it is
 * cached like everything else and never fetched again.
 */

import { useCallback, useEffect, useState } from 'react';
import { getAllBusRoutes } from '../services/lta';
import { readCache, writeCache, CacheKey } from '../services/storage';
import type { BusRoute } from '../types/lta';

export type RoutesStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RoutesState {
  status: RoutesStatus;
  routes: BusRoute[];
  progress: number;
  error: string | null;
  retry: () => void;
}

export function useBusRoutes(enabled = true): RoutesState {
  const [status, setStatus] = useState<RoutesStatus>('idle');
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setProgress(0);

    const cached = await readCache<BusRoute[]>(CacheKey.BusRoutes);
    if (cached?.length) {
      setRoutes(cached);
      setStatus('ready');
      return;
    }

    try {
      const fresh = await getAllBusRoutes(setProgress);
      setRoutes(fresh);
      setStatus('ready');
      await writeCache(CacheKey.BusRoutes, fresh);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load route data.'
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { status, routes, progress, error, retry: load };
}
