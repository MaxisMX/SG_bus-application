/**
 * Pure mappings from LTA data codes to display values.
 *
 * Kept separate from the components so they can be unit tested without
 * rendering anything, and so the same mapping is guaranteed to be used
 * everywhere the data appears.
 */

import type { BusLoad, BusType, Operator } from '../types/lta';

/**
 * Crowding as a 0-3 gauge level.
 *
 * Shown as filled segments rather than a colour alone, so the
 * information survives colour blindness and greyscale screenshots.
 *
 * 3 = plenty of room, 1 = nearly full, 0 = not reported.
 */
export function loadLevel(load: BusLoad): 0 | 1 | 2 | 3 {
  switch (load) {
    case 'SEA':
      return 3;
    case 'SDA':
      return 2;
    case 'LSD':
      return 1;
    default:
      return 0;
  }
}

/** Short label for the crowding gauge. */
export function loadLabel(load: BusLoad): string {
  switch (load) {
    case 'SEA':
      return 'Seats';
    case 'SDA':
      return 'Standing';
    case 'LSD':
      return 'Crowded';
    default:
      return '';
  }
}

/** Readable bus type, used in accessibility labels. */
export function describeBusType(type: BusType): string {
  switch (type) {
    case 'SD':
      return 'Single deck';
    case 'DD':
      return 'Double deck';
    case 'BD':
      return 'Bendy bus';
    default:
      return '';
  }
}

/** One-character marker for bus type, shown beside the service number. */
export function busTypeGlyph(type: BusType): string {
  switch (type) {
    case 'SD':
      return '\u25AC'; // single bar
    case 'DD':
      return '\u2261'; // stacked bars
    case 'BD':
      return '\u25AC\u25AC'; // two linked bars
    default:
      return '';
  }
}

/** Full operator name for accessibility labels and the route screen. */
export function describeOperator(operator: Operator): string {
  switch (operator) {
    case 'SBST':
      return 'SBS Transit';
    case 'SMRT':
      return 'SMRT Buses';
    case 'TTS':
      return 'Tower Transit';
    case 'GAS':
      return 'Go-Ahead Singapore';
    default:
      return operator;
  }
}

/**
 * A single spoken sentence describing one arrival, for screen readers.
 *
 * Built here rather than in the component so the phrasing is consistent
 * and can be asserted in tests.
 */
export function arrivalAccessibilityLabel(params: {
  serviceNo: string;
  eta: string;
  load: BusLoad;
  busType: BusType;
  monitored: boolean;
}): string {
  const { serviceNo, eta, load, busType, monitored } = params;

  const timing =
    eta === '-'
      ? 'no arrival time available'
      : eta === 'Arr'
        ? 'arriving now'
        : `arriving in ${eta} minutes`;

  const parts = [`Bus ${serviceNo}`, timing];

  const crowding = loadLabel(load);
  if (crowding) parts.push(crowding.toLowerCase());

  const vehicle = describeBusType(busType);
  if (vehicle) parts.push(vehicle.toLowerCase());

  if (!monitored && eta !== '-') parts.push('estimated from timetable');

  return parts.join(', ') + '.';
}
