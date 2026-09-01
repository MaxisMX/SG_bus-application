/**
 * Delays a rapidly changing value until it settles.
 *
 * Search runs over roughly 5,000 stops. Filtering on every keystroke is
 * survivable but makes typing feel sticky on mid-range phones, so the
 * query is only applied once the user pauses.
 */

import { useEffect, useState } from 'react';

/**
 * @param value the value to debounce
 * @param delay milliseconds of quiet before the value is applied
 */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    // Each new keystroke cancels the pending update, so the timer only
    // fires once typing actually stops.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
