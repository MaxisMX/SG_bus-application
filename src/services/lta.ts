/**
 * The single point of contact with LTA DataMall.
 *
 * Nothing else in the app should call fetch() directly. Keeping all
 * network access here means screens can be tested by mocking this one
 * module, and swapping the endpoint or auth scheme touches one file.
 */

import type {
  BusArrivalResponse,
  BusStop,
  BusService,
  BusRoute,
  DataMallCollection,
} from '../types/lta';

const BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

/** LTA caps every static dataset response at 500 records. */
const PAGE_SIZE = 500;

/**
 * Read the key from the Expo environment.
 *
 * NOTE: anything prefixed EXPO_PUBLIC_ is embedded in the app bundle and
 * can be extracted from a released build. For production this should sit
 * behind a proxy that holds the key server-side. Documented as a known
 * limitation rather than silently ignored.
 */
const ACCOUNT_KEY = process.env.EXPO_PUBLIC_LTA_KEY ?? '';

/** Thrown for any non-2xx response, carrying the status for the UI. */
export class LtaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string
  ) {
    super(message);
    this.name = 'LtaApiError';
  }
}

/**
 * Perform an authenticated GET and parse the JSON body.
 * @throws LtaApiError on any non-2xx response.
 */
async function request<T>(path: string): Promise<T> {
  if (!ACCOUNT_KEY) {
    throw new LtaApiError(
      'Missing API key. Set EXPO_PUBLIC_LTA_KEY in your .env file.',
      0,
      path
    );
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      AccountKey: ACCOUNT_KEY,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const detail =
      response.status === 401
        ? 'API key was rejected.'
        : `Request failed with status ${response.status}.`;
    throw new LtaApiError(detail, response.status, path);
  }

  return (await response.json()) as T;
}

/**
 * Live arrival times for one stop.
 *
 * An empty Services array is normal, not an error: it means no buses are
 * currently running at that stop.
 */
export async function getArrivals(
  busStopCode: string,
  serviceNo?: string
): Promise<BusArrivalResponse> {
  const params = new URLSearchParams({ BusStopCode: busStopCode });
  if (serviceNo) params.set('ServiceNo', serviceNo);

  return request<BusArrivalResponse>(`/v3/BusArrival?${params.toString()}`);
}

/**
 * Walk a paginated static dataset until a short page signals the end.
 *
 * @param path     endpoint path, e.g. '/BusStops'
 * @param onProgress optional callback so the UI can show a progress bar
 */
async function fetchAllPages<T>(
  path: string,
  onProgress?: (loaded: number) => void
): Promise<T[]> {
  const all: T[] = [];
  let skip = 0;

  // A page shorter than PAGE_SIZE means we've reached the last one.
  for (;;) {
    const page = await request<DataMallCollection<T>>(
      `${path}?$skip=${skip}`
    );
    const records = page.value ?? [];

    all.push(...records);
    onProgress?.(all.length);

    if (records.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return all;
}

/** Every bus stop in Singapore (~5,000 records, ~11 requests). */
export function getAllBusStops(
  onProgress?: (loaded: number) => void
): Promise<BusStop[]> {
  return fetchAllPages<BusStop>('/BusStops', onProgress);
}

/** Every bus service and direction (~700 records). */
export function getAllBusServices(
  onProgress?: (loaded: number) => void
): Promise<BusService[]> {
  return fetchAllPages<BusService>('/BusServices', onProgress);
}

/** Every stop on every route (~26,000 records, ~53 requests). Slow. */
export function getAllBusRoutes(
  onProgress?: (loaded: number) => void
): Promise<BusRoute[]> {
  return fetchAllPages<BusRoute>('/BusRoutes', onProgress);
}
