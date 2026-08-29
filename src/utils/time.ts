/**
 * Pure functions for turning LTA arrival timestamps into things we can
 * show on screen.
 *
 * These are deliberately free of React and network code so they can be
 * unit tested in isolation. `now` is always injectable so tests are
 * deterministic rather than depending on the clock.
 */

import type { NextBus, BusLoad } from '../types/lta';

/** Milliseconds in one minute. */
const MS_PER_MINUTE = 60_000;

/**
 * Minutes until a bus arrives.
 *
 * @returns whole minutes (0 when arriving now or already due), or null
 *          when there is no usable timestamp.
 */
export function minutesUntil(
  estimatedArrival: string | null | undefined,
  now: Date = new Date()
): number | null {
  if (!estimatedArrival) return null;

  const arrival = new Date(estimatedArrival);
  if (Number.isNaN(arrival.getTime())) return null;

  const diffMs = arrival.getTime() - now.getTime();

  // A bus slightly in the past is at the stop right now, not an error.
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / MS_PER_MINUTE);
}

/**
 * Display string for an arrival time.
 *
 * '-'   no data
 * 'Arr' arriving now (under a minute)
 * '7'   seven minutes away
 */
export function formatEta(
  estimatedArrival: string | null | undefined,
  now: Date = new Date()
): string {
  const mins = minutesUntil(estimatedArrival, now);
  if (mins === null) return '-';
  if (mins < 1) return 'Arr';
  return String(mins);
}

/**
 * Clock time a bus is due, for users who prefer '15:27' over '7 min'.
 * Uses the device locale and 24-hour format.
 */
export function formatClockTime(
  estimatedArrival: string | null | undefined
): string {
  if (!estimatedArrival) return '-';

  const arrival = new Date(estimatedArrival);
  if (Number.isNaN(arrival.getTime())) return '-';

  return arrival.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * True when the bus object carries no usable arrival data.
 * LTA returns empty objects and empty strings rather than omitting keys.
 */
export function isBusUnavailable(bus: NextBus | null | undefined): boolean {
  return !bus || !bus.EstimatedArrival;
}

/**
 * Human label for a crowding code, for accessibility labels and legends.
 */
export function describeLoad(load: BusLoad): string {
  switch (load) {
    case 'SEA':
      return 'Seats available';
    case 'SDA':
      return 'Standing available';
    case 'LSD':
      return 'Limited standing';
    default:
      return 'Crowding unknown';
  }
}

/**
 * Parse an LTA 'HHMM' time string into minutes since midnight.
 * Returns null for '-' or malformed values.
 */
export function parseHHMM(value: string | null | undefined): number | null {
  if (!value || value === '-' || value.length !== 4) return null;

  const hours = Number(value.slice(0, 2));
  const minutes = Number(value.slice(2, 4));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  // Hours can legitimately reach 24+ for services running past midnight.
  if (hours > 27 || minutes > 59) return null;

  return hours * 60 + minutes;
}
