/**
 * The device's current position, with permission handling.
 *
 * Location is optional throughout the app: if it is refused, the nearby
 * screen degrades to a prompt rather than breaking, and search continues
 * to work exactly as before.
 */

import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../utils/geo';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'error';

export interface LocationState {
  status: LocationStatus;
  coords: Coordinates | null;
  error: string | null;
  request: () => Promise<void>;
}

export function useLocation(autoRequest = true): LocationState {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async () => {
    setStatus('requesting');
    setError(null);

    try {
      const { status: permission } =
        await Location.requestForegroundPermissionsAsync();

      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      // Balanced accuracy is plenty for picking the nearest bus stop and
      // uses noticeably less battery than the highest setting.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('ready');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not determine your location.'
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!autoRequest) return;
    void request();
  }, [autoRequest, request]);

  return { status, coords, error, request };
}
