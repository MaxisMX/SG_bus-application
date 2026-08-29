/**
 * Local persistence for the static LTA datasets.
 *
 * The bus stop and route lists change rarely but are expensive to fetch
 * (5,000 and 26,000 records respectively). We download them once, cache
 * them on the device, and refresh only when the cache is old or the
 * schema version changes.
 *
 * Caching also means search works with no network at all, which matters
 * on the MRT and in lift lobbies.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bump this when the shape of a cached record changes. Any cache written
 * under an older version is discarded rather than being read back with
 * fields the app no longer understands.
 */
const SCHEMA_VERSION = 1;

/** Refresh static data weekly; LTA updates it far less often than that. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const CacheKey = {
  BusStops: 'cache:busstops',
  BusServices: 'cache:busservices',
  BusRoutes: 'cache:busroutes',
} as const;

export type CacheKeyName = (typeof CacheKey)[keyof typeof CacheKey];

/** Envelope stored alongside the data so we can judge its freshness. */
interface CacheEnvelope<T> {
  version: number;
  savedAt: number;
  data: T;
}

/**
 * Read a cached dataset.
 *
 * @returns the data, or null when absent, stale, corrupt, or written by
 *          an older schema version.
 */
export async function readCache<T>(key: CacheKeyName): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as CacheEnvelope<T>;

    if (envelope.version !== SCHEMA_VERSION) return null;
    if (Date.now() - envelope.savedAt > MAX_AGE_MS) return null;

    return envelope.data;
  } catch {
    // Corrupt JSON or storage failure: treat as a cache miss rather than
    // crashing. The caller will refetch.
    return null;
  }
}

/**
 * Write a dataset to the cache.
 * Failures are swallowed: a cache write failing should degrade
 * performance, never break the app.
 */
export async function writeCache<T>(
  key: CacheKeyName,
  data: T
): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = {
      version: SCHEMA_VERSION,
      savedAt: Date.now(),
      data,
    };
    await AsyncStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Intentionally ignored, see above.
  }
}

/** When a dataset was last saved, for a "last updated" line in Settings. */
export async function getCacheAge(
  key: CacheKeyName
): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as CacheEnvelope<unknown>;
    return new Date(envelope.savedAt);
  } catch {
    return null;
  }
}

/** Clear all cached datasets, for a "refresh data" button in Settings. */
export async function clearCache(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(CacheKey));
}
