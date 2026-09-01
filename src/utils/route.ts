/**
 * Pure helpers for turning the flat BusRoutes dataset into something a
 * screen can render.
 *
 * LTA returns one row per stop per direction, roughly 26,000 rows in
 * total, with no grouping. Everything here filters and orders that flat
 * list without touching the network or React, so it can all be unit
 * tested directly.
 */

import type { BusRoute } from '../types/lta';
import { parseHHMM } from './time';

/** Which timetable column applies today. */
export type DayType = 'WD' | 'SAT' | 'SUN';

/**
 * Work out which timetable applies.
 *
 * Note this uses the device's day, not Singapore's. Acceptable because
 * the app is for use in Singapore, but worth knowing if it is ever used
 * from another timezone.
 */
export function getDayType(date: Date = new Date()): DayType {
  const day = date.getDay(); // 0 = Sunday

  if (day === 0) return 'SUN';
  if (day === 6) return 'SAT';
  return 'WD';
}

/** First and last bus times for a stop, for the given day type. */
export function firstLastBus(
  route: BusRoute,
  dayType: DayType = getDayType()
): { first: string | null; last: string | null } {
  const raw =
    dayType === 'SUN'
      ? { first: route.SUN_FirstBus, last: route.SUN_LastBus }
      : dayType === 'SAT'
        ? { first: route.SAT_FirstBus, last: route.SAT_LastBus }
        : { first: route.WD_FirstBus, last: route.WD_LastBus };

  return {
    first: parseHHMM(raw.first) === null ? null : formatHHMM(raw.first),
    last: parseHHMM(raw.last) === null ? null : formatHHMM(raw.last),
  };
}

/**
 * Turn '0500' into '05:00'.
 *
 * Times past midnight are reported as 24xx or 25xx, which would display
 * as '24:30'. Those are wrapped so late night services read as '00:30'.
 */
export function formatHHMM(value: string): string {
  const minutes = parseHHMM(value);
  if (minutes === null) return '-';

  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Which directions a service runs.
 * Loop services have only direction 1; most trunk services have 1 and 2.
 */
export function getDirections(
  routes: BusRoute[],
  serviceNo: string
): number[] {
  const directions = new Set<number>();

  for (const route of routes) {
    if (route.ServiceNo === serviceNo) directions.add(route.Direction);
  }

  return [...directions].sort((a, b) => a - b);
}

/**
 * All stops for one service in one direction, in travel order.
 */
export function getRouteStops(
  routes: BusRoute[],
  serviceNo: string,
  direction: number
): BusRoute[] {
  return routes
    .filter(
      route => route.ServiceNo === serviceNo && route.Direction === direction
    )
    .sort((a, b) => a.StopSequence - b.StopSequence);
}

/**
 * Total route length in km, taken from the final stop's cumulative
 * distance rather than by summing, which would double count.
 */
export function getRouteDistance(stops: BusRoute[]): number {
  if (stops.length === 0) return 0;
  return stops[stops.length - 1].Distance;
}

/**
 * Distance in km between two stops on the same route.
 * Returns null when either stop is not on this route.
 *
 * This is the basis of fare estimation: Singapore bus fares are charged
 * by distance travelled rather than by a flat rate.
 */
export function distanceBetween(
  stops: BusRoute[],
  fromCode: string,
  toCode: string
): number | null {
  const from = stops.find(stop => stop.BusStopCode === fromCode);
  const to = stops.find(stop => stop.BusStopCode === toCode);

  if (!from || !to) return null;
  if (to.StopSequence < from.StopSequence) return null; // wrong direction

  return Number((to.Distance - from.Distance).toFixed(1));
}

/**
 * How many stops away a given stop is from the start of the route.
 * 1-based, matching StopSequence. Null when not on this route.
 */
export function stopsUntil(
  stops: BusRoute[],
  fromCode: string,
  toCode: string
): number | null {
  const from = stops.find(stop => stop.BusStopCode === fromCode);
  const to = stops.find(stop => stop.BusStopCode === toCode);

  if (!from || !to) return null;

  return to.StopSequence - from.StopSequence;
}
