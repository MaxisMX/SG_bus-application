/**
 * Live arrival data for one bus stop.
 *
 * Two separate clocks run here, and keeping them apart matters:
 *
 *  - a network refresh every 30 seconds, which costs an API call
 *  - a local tick every second, which costs nothing and simply
 *    recomputes the countdown from timestamps we already hold
 *
 * Without the local tick the numbers would sit frozen for 30 seconds at
 * a time and the screen would feel dead. Without the separation we would
 * be hammering the API once a second for data that only changes every
 * 20 to 30 seconds anyway.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getArrivals, LtaApiError } from '../services/lta';
import type { ArrivalService } from '../types/lta';

/** How often to refetch from LTA while the screen is visible. */
const REFRESH_MS = 30_000;

/** How often to recompute countdowns from cached timestamps. */
const TICK_MS = 1_000;

export type ArrivalStatus = 'loading' | 'ready' | 'refreshing' | 'error';

export interface ArrivalsState {
  status: ArrivalStatus;
  services: ArrivalService[];
  /** Changes every second; components read it to recompute countdowns. */
  now: Date;
  /** When the data was last successfully fetched. */
  lastUpdated: Date | null;
  error: string | null;
  /** True when LTA returned no services, which is normal off-hours. */
  isEmpty: boolean;
  refresh: () => void;
}

/**
 * @param busStopCode the five digit stop code
 * @param active      set false to pause polling when the screen is not
 *                    visible, so a backgrounded app stops making calls
 */
export function useArrivals(
  busStopCode: string | undefined,
  active = true
): ArrivalsState {
  const [status, setStatus] = useState<ArrivalStatus>('loading');
  const [services, setServices] = useState<ArrivalService[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Guards against a slow response overwriting newer data. */
  const requestId = useRef(0);
  /** Tracks whether the app itself is in the foreground. */
  const appActive = useRef(true);

  const fetchArrivals = useCallback(
    async (isRefresh: boolean) => {
      if (!busStopCode) return;

      const id = ++requestId.current;
      setStatus(isRefresh ? 'refreshing' : 'loading');
      setError(null);

      try {
        const data = await getArrivals(busStopCode);

        // A newer request finished first; discard this stale response.
        if (id !== requestId.current) return;

        setServices(data.Services ?? []);
        setLastUpdated(new Date());
        setStatus('ready');
      } catch (e) {
        if (id !== requestId.current) return;

        const message =
          e instanceof Error && e.name === 'LtaApiError'
            ? e.message
            : e instanceof Error && e.message
              ? e.message
              : 'Could not reach the bus service. Check your connection.';

        setError(message);
        setStatus('error');
      }
    },
    [busStopCode]
  );

  // Initial fetch, and refetch whenever the stop changes.
  useEffect(() => {
    if (!busStopCode) return;
    void fetchArrivals(false);
  }, [busStopCode, fetchArrivals]);

  // Network refresh loop, paused when the screen or app is inactive.
  useEffect(() => {
    if (!active || !busStopCode) return;

    const interval = setInterval(() => {
      if (appActive.current) void fetchArrivals(true);
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, [active, busStopCode, fetchArrivals]);

  // Local countdown tick. Cheap: no network, just a new Date.
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, [active]);

  // Refetch immediately on return from the background, since whatever is
  // on screen is stale by however long the app was away.
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      const wasActive = appActive.current;
      appActive.current = state === 'active';

      if (!wasActive && appActive.current && active) {
        void fetchArrivals(true);
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [active, fetchArrivals]);

  const refresh = useCallback(() => {
    void fetchArrivals(true);
  }, [fetchArrivals]);

  return {
    status,
    services,
    now,
    lastUpdated,
    error,
    isEmpty: status === 'ready' && services.length === 0,
    refresh,
  };
}
