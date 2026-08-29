/**
 * Search and ranking over the cached bus stop and service lists.
 *
 * These run on every keystroke against ~5,000 stops, so they avoid regex
 * construction and sort only the matches rather than the whole dataset.
 * Being pure functions, they are also the easiest part of the app to
 * test thoroughly.
 */

import type { BusStop, BusService } from '../types/lta';

/** Case-insensitive, whitespace-tolerant normalisation. */
function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Relevance score for a stop against a query. Higher is better;
 * 0 means no match.
 *
 * Ranking rationale: someone typing '83139' wants that exact stop first,
 * and someone typing 'bedok' wants stops whose name starts with Bedok
 * before ones that merely contain it.
 */
function scoreStop(stop: BusStop, query: string): number {
  const q = normalise(query);
  const code = stop.BusStopCode.toLowerCase();
  const description = normalise(stop.Description);
  const road = normalise(stop.RoadName);

  if (code === q) return 100; // exact stop code
  if (code.startsWith(q)) return 90; // partial stop code
  if (description === q) return 80; // exact name
  if (description.startsWith(q)) return 70; // name prefix
  if (road.startsWith(q)) return 60; // road prefix
  if (description.includes(q)) return 50; // name contains
  if (road.includes(q)) return 40; // road contains

  return 0;
}

/**
 * Search bus stops by code, description, or road name.
 *
 * @param limit caps results so the list stays responsive on long queries
 */
export function searchStops(
  stops: BusStop[],
  query: string,
  limit = 50
): BusStop[] {
  const q = normalise(query);
  if (!q) return [];

  const scored: { stop: BusStop; score: number }[] = [];

  for (const stop of stops) {
    const score = scoreStop(stop, q);
    if (score > 0) scored.push({ stop, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Stable tiebreak so results don't jump around between renders.
    return a.stop.Description.localeCompare(b.stop.Description);
  });

  return scored.slice(0, limit).map(entry => entry.stop);
}

/**
 * Bus service numbers are alphanumeric ('96', '96B', 'NR7'), so they
 * need natural ordering rather than plain string comparison, otherwise
 * '10' sorts before '9'.
 */
export function compareServiceNo(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);

  const aIsNumeric = !Number.isNaN(numA);
  const bIsNumeric = !Number.isNaN(numB);

  // Purely alphabetic services (NR7, CT8) sort after numeric ones.
  if (!aIsNumeric && !bIsNumeric) return a.localeCompare(b);
  if (!aIsNumeric) return 1;
  if (!bIsNumeric) return -1;

  if (numA !== numB) return numA - numB;

  // Same number, different suffix: 96 before 96A before 96B.
  return a.localeCompare(b);
}

/**
 * Search bus services by number.
 * Deduplicated by ServiceNo, since LTA lists each direction separately.
 */
export function searchServices(
  services: BusService[],
  query: string,
  limit = 50
): BusService[] {
  const q = normalise(query);
  if (!q) return [];

  const seen = new Set<string>();
  const matches: BusService[] = [];

  for (const service of services) {
    const no = service.ServiceNo.toLowerCase();
    if (!no.startsWith(q)) continue;
    if (seen.has(service.ServiceNo)) continue;

    seen.add(service.ServiceNo);
    matches.push(service);
  }

  matches.sort((a, b) => compareServiceNo(a.ServiceNo, b.ServiceNo));

  return matches.slice(0, limit);
}

/**
 * True when the query looks like a bus stop code: exactly five digits.
 * Used to decide which search tab to open by default.
 */
export function looksLikeStopCode(query: string): boolean {
  return /^\d{5}$/.test(query.trim());
}
