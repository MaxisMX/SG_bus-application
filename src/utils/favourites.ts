/**
 * Favourites logic, kept separate from storage and React.
 *
 * A favourite is either a whole stop, or one service at one stop. The
 * second case is the one people actually want: someone who takes bus 196
 * from Bedok does not care about the other eleven services there.
 */

export interface Favourite {
  stopCode: string;
  /** Undefined means the whole stop is saved. */
  serviceNo?: string;
  /** Optional user label, e.g. 'Home' or 'Office'. */
  label?: string;
}

/**
 * Stable identity for a favourite, used as a React key and for
 * comparison. '*' marks a whole-stop favourite so it cannot collide with
 * a service literally named after the wildcard.
 */
export function favouriteKey(favourite: Favourite): string {
  return `${favourite.stopCode}:${favourite.serviceNo ?? '*'}`;
}

/** Whether a favourite is already saved. */
export function isFavourite(
  favourites: Favourite[],
  candidate: Favourite
): boolean {
  const key = favouriteKey(candidate);
  return favourites.some(item => favouriteKey(item) === key);
}

/**
 * Add if absent, remove if present.
 * Returns a new array rather than mutating, so React sees the change.
 */
export function toggleFavourite(
  favourites: Favourite[],
  candidate: Favourite
): Favourite[] {
  const key = favouriteKey(candidate);

  if (favourites.some(item => favouriteKey(item) === key)) {
    return favourites.filter(item => favouriteKey(item) !== key);
  }

  return [...favourites, candidate];
}

/** Remove a favourite by key. */
export function removeFavourite(
  favourites: Favourite[],
  key: string
): Favourite[] {
  return favourites.filter(item => favouriteKey(item) !== key);
}

/**
 * Move a favourite to a new position, for drag-to-reorder.
 * Out-of-range indices return the list unchanged rather than throwing.
 */
export function reorderFavourites(
  favourites: Favourite[],
  from: number,
  to: number
): Favourite[] {
  if (from === to) return favourites;
  if (from < 0 || from >= favourites.length) return favourites;
  if (to < 0 || to >= favourites.length) return favourites;

  const next = [...favourites];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
}

/** Group favourites by stop, so one stop renders as one card. */
export function groupByStop(
  favourites: Favourite[]
): { stopCode: string; services: string[] }[] {
  const groups = new Map<string, string[]>();

  for (const favourite of favourites) {
    const existing = groups.get(favourite.stopCode) ?? [];

    // A whole-stop favourite contributes no specific service.
    if (favourite.serviceNo) existing.push(favourite.serviceNo);

    groups.set(favourite.stopCode, existing);
  }

  return [...groups.entries()].map(([stopCode, services]) => ({
    stopCode,
    services,
  }));
}
