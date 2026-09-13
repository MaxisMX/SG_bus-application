/**
 * Geographic helpers.
 *
 * Pure functions with no dependency on the location API, so they can be
 * tested against known coordinates rather than requiring a device.
 */

import type { BusStop } from '../types/lta';

/** Mean radius of the Earth in metres. */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Average walking speed in metres per minute.
 *
 * 80 m/min (4.8 km/h) is a widely used planning figure for adult
 * pedestrians. Deliberately conservative: telling someone they will make
 * a bus they then miss is worse than the reverse.
 */
export const WALKING_SPEED_M_PER_MIN = 80;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Translate LTA's field names to the coordinates used by location helpers. */
export function stopCoordinates(stop: BusStop): Coordinates {
  return { latitude: stop.Latitude, longitude: stop.Longitude };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two points, in metres.
 *
 * Uses the haversine formula. Over the distances involved here (a few
 * hundred metres to a few km) the error against a full ellipsoidal
 * calculation is well under a metre.
 */
export function haversineMeters(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a)));
}

/**
 * Distance as a short label.
 * Metres below 1 km, kilometres above, since '1200 m' reads worse
 * than '1.2 km' at a glance.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Minutes to walk a given distance, rounded up.
 *
 * Rounding up rather than to nearest: a 4.2 minute walk reported as
 * 4 minutes can cost someone the bus.
 */
export function walkingMinutes(
  meters: number,
  speed = WALKING_SPEED_M_PER_MIN
): number {
  if (meters <= 0) return 0;
  return Math.ceil(meters / speed);
}

/**
 * Attach distances to a list and return the closest items first.
 *
 * @param maxDistance metres; anything further is dropped entirely
 * @param limit       how many to keep after sorting
 */
export function sortByDistance<T extends Coordinates>(
  items: T[],
  origin: Coordinates,
  maxDistance = 1000,
  limit = 30
): (T & { distance: number })[] {
  const withDistance: (T & { distance: number })[] = [];

  for (const item of items) {
    const distance = haversineMeters(origin, item);
    if (distance <= maxDistance) {
      withDistance.push({ ...item, distance });
    }
  }

  withDistance.sort((a, b) => a.distance - b.distance);

  return withDistance.slice(0, limit);
}

/**
 * Whether a bus can still be caught on foot.
 *
 * The basis of the "can I make it" feature: compares walking time to the
 * stop against the bus's estimated arrival.
 *
 * @param walkMinutes    time to reach the stop
 * @param arrivalMinutes time until the bus arrives, or null if unknown
 * @param buffer         slack in minutes, since neither estimate is exact
 */
export function canCatchBus(
  walkMinutes: number,
  arrivalMinutes: number | null,
  buffer = 1
): 'yes' | 'tight' | 'no' | 'unknown' {
  if (arrivalMinutes === null) return 'unknown';

  const margin = arrivalMinutes - walkMinutes;

  if (margin >= buffer + 2) return 'yes';
  if (margin >= buffer) return 'tight';
  return 'no';
}
