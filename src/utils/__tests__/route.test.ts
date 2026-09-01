import {
  getDayType,
  firstLastBus,
  formatHHMM,
  getDirections,
  getRouteStops,
  getRouteDistance,
  distanceBetween,
  stopsUntil,
} from '../route';
import type { BusRoute } from '../../types/lta';

const route = (
  ServiceNo: string,
  Direction: 1 | 2,
  StopSequence: number,
  BusStopCode: string,
  Distance: number,
  overrides: Partial<BusRoute> = {}
): BusRoute => ({
  ServiceNo,
  Operator: 'SBST',
  Direction,
  StopSequence,
  BusStopCode,
  Distance,
  WD_FirstBus: '0500',
  WD_LastBus: '2300',
  SAT_FirstBus: '0530',
  SAT_LastBus: '2300',
  SUN_FirstBus: '0600',
  SUN_LastBus: '2245',
  ...overrides,
});

// Deliberately out of order, to prove the sort works.
const ROUTES: BusRoute[] = [
  route('10', 1, 3, '75009', 2.4),
  route('10', 1, 1, '75001', 0),
  route('10', 1, 2, '75005', 1.2),
  route('10', 2, 1, '99001', 0),
  route('10', 2, 2, '99005', 1.5),
  route('196', 1, 1, '01012', 0),
];

describe('getDayType', () => {
  it('treats Sunday as its own timetable', () => {
    expect(getDayType(new Date('2024-08-25T10:00:00'))).toBe('SUN');
  });

  it('treats Saturday as its own timetable', () => {
    expect(getDayType(new Date('2024-08-24T10:00:00'))).toBe('SAT');
  });

  it('treats Monday to Friday as weekdays', () => {
    expect(getDayType(new Date('2024-08-22T10:00:00'))).toBe('WD');
    expect(getDayType(new Date('2024-08-19T10:00:00'))).toBe('WD');
  });
});

describe('formatHHMM', () => {
  it('inserts a colon', () => {
    expect(formatHHMM('0500')).toBe('05:00');
    expect(formatHHMM('2300')).toBe('23:00');
  });

  it('wraps past-midnight times so they read as clock times', () => {
    // LTA reports 00:30 the next day as '2430'.
    expect(formatHHMM('2430')).toBe('00:30');
    expect(formatHHMM('2515')).toBe('01:15');
  });

  it('shows a dash for services that do not run', () => {
    expect(formatHHMM('-')).toBe('-');
  });
});

describe('firstLastBus', () => {
  const stop = ROUTES[0];

  it('reads the weekday column on a weekday', () => {
    expect(firstLastBus(stop, 'WD')).toEqual({
      first: '05:00',
      last: '23:00',
    });
  });

  it('reads the Saturday column on a Saturday', () => {
    expect(firstLastBus(stop, 'SAT').first).toBe('05:30');
  });

  it('reads the Sunday column on a Sunday', () => {
    expect(firstLastBus(stop, 'SUN').last).toBe('22:45');
  });

  it('returns null when the service does not run that day', () => {
    const sundayless = route('10', 1, 1, '75001', 0, {
      SUN_FirstBus: '-',
      SUN_LastBus: '-',
    });

    expect(firstLastBus(sundayless, 'SUN')).toEqual({
      first: null,
      last: null,
    });
  });
});

describe('getDirections', () => {
  it('finds both directions of a trunk service', () => {
    expect(getDirections(ROUTES, '10')).toEqual([1, 2]);
  });

  it('finds the single direction of a loop service', () => {
    expect(getDirections(ROUTES, '196')).toEqual([1]);
  });

  it('returns nothing for an unknown service', () => {
    expect(getDirections(ROUTES, '999')).toEqual([]);
  });
});

describe('getRouteStops', () => {
  it('returns stops in travel order regardless of input order', () => {
    const stops = getRouteStops(ROUTES, '10', 1);
    expect(stops.map(s => s.BusStopCode)).toEqual([
      '75001',
      '75005',
      '75009',
    ]);
  });

  it('keeps the two directions separate', () => {
    const stops = getRouteStops(ROUTES, '10', 2);
    expect(stops.map(s => s.BusStopCode)).toEqual(['99001', '99005']);
  });

  it('returns nothing for a direction the service does not run', () => {
    expect(getRouteStops(ROUTES, '196', 2)).toEqual([]);
  });
});

describe('getRouteDistance', () => {
  it('takes the total from the final stop rather than summing', () => {
    const stops = getRouteStops(ROUTES, '10', 1);
    expect(getRouteDistance(stops)).toBe(2.4);
  });

  it('returns zero for an empty route', () => {
    expect(getRouteDistance([])).toBe(0);
  });
});

describe('distanceBetween', () => {
  const stops = getRouteStops(ROUTES, '10', 1);

  it('measures the gap between two stops', () => {
    expect(distanceBetween(stops, '75001', '75009')).toBe(2.4);
    expect(distanceBetween(stops, '75005', '75009')).toBe(1.2);
  });

  it('refuses to measure backwards along the route', () => {
    // You cannot board at the terminus and alight at the origin.
    expect(distanceBetween(stops, '75009', '75001')).toBeNull();
  });

  it('returns null when a stop is not on this route', () => {
    expect(distanceBetween(stops, '75001', '01012')).toBeNull();
  });
});

describe('stopsUntil', () => {
  const stops = getRouteStops(ROUTES, '10', 1);

  it('counts stops between two points', () => {
    expect(stopsUntil(stops, '75001', '75009')).toBe(2);
  });

  it('returns zero for the same stop', () => {
    expect(stopsUntil(stops, '75005', '75005')).toBe(0);
  });

  it('returns null for a stop not on the route', () => {
    expect(stopsUntil(stops, '75001', '99999')).toBeNull();
  });
});
