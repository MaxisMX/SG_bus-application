import {
  searchStops,
  searchServices,
  compareServiceNo,
  looksLikeStopCode,
} from '../search';
import type { BusStop, BusService } from '../../types/lta';

const stop = (
  BusStopCode: string,
  Description: string,
  RoadName: string
): BusStop => ({
  BusStopCode,
  Description,
  RoadName,
  Latitude: 1.3,
  Longitude: 103.8,
});

const STOPS: BusStop[] = [
  stop('01012', 'Hotel Grand Pacific', 'Victoria St'),
  stop('01013', 'St. Joseph\u2019s Ch', 'Victoria St'),
  stop('83139', 'Opp Bedok Stn Exit B', 'Bedok Nth Ave 3'),
  stop('84009', 'Bedok Int', 'New Upp Changi Rd'),
  stop('84461', 'Aft Bedok Sth Ave 1', 'Bedok Sth Ave 1'),
];

const service = (ServiceNo: string, Direction: 1 | 2 = 1): BusService => ({
  ServiceNo,
  Operator: 'SBST',
  Direction,
  Category: 'TRUNK',
  OriginCode: '75009',
  DestinationCode: '75009',
  AM_Peak_Freq: '5-08',
  AM_Offpeak_Freq: '8-12',
  PM_Peak_Freq: '8-10',
  PM_Offpeak_Freq: '09-14',
  LoopDesc: '',
});

describe('searchStops', () => {
  it('returns nothing for an empty query', () => {
    expect(searchStops(STOPS, '')).toEqual([]);
    expect(searchStops(STOPS, '   ')).toEqual([]);
  });

  it('puts an exact stop code first', () => {
    const results = searchStops(STOPS, '83139');
    expect(results[0].BusStopCode).toBe('83139');
  });

  it('matches a partial stop code', () => {
    const results = searchStops(STOPS, '010');
    expect(results.map(s => s.BusStopCode)).toEqual(['01012', '01013']);
  });

  it('ranks a name prefix above a name that merely contains the query', () => {
    const results = searchStops(STOPS, 'bedok');
    // 'Bedok Int' starts with the query; the others only contain it.
    expect(results[0].Description).toBe('Bedok Int');
  });

  it('is case insensitive', () => {
    expect(searchStops(STOPS, 'BEDOK').length).toBe(
      searchStops(STOPS, 'bedok').length
    );
  });

  it('ignores surrounding whitespace', () => {
    expect(searchStops(STOPS, '  bedok  ').length).toBeGreaterThan(0);
  });

  it('matches on road name', () => {
    const results = searchStops(STOPS, 'victoria');
    expect(results).toHaveLength(2);
  });

  it('returns nothing when there is no match', () => {
    expect(searchStops(STOPS, 'zzzzz')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(searchStops(STOPS, 'bedok', 1)).toHaveLength(1);
  });
});

describe('compareServiceNo', () => {
  it('orders numerically, not as strings', () => {
    // Plain string sorting would place '10' before '9'.
    expect(compareServiceNo('9', '10')).toBeLessThan(0);
  });

  it('orders a bare number before its lettered variants', () => {
    expect(compareServiceNo('96', '96A')).toBeLessThan(0);
    expect(compareServiceNo('96A', '96B')).toBeLessThan(0);
  });

  it('sorts alphabetic services after numeric ones', () => {
    expect(compareServiceNo('NR7', '196')).toBeGreaterThan(0);
  });
});

describe('searchServices', () => {
  const SERVICES = [
    service('196'),
    service('196', 2),
    service('96'),
    service('96A'),
    service('9'),
    service('NR7'),
  ];

  it('matches on prefix only, so 96 does not match 196', () => {
    const results = searchServices(SERVICES, '96');
    expect(results.map(s => s.ServiceNo)).toEqual(['96', '96A']);
  });

  it('deduplicates the two directions of one service', () => {
    const results = searchServices(SERVICES, '196');
    expect(results).toHaveLength(1);
  });

  it('sorts results in natural order', () => {
    const results = searchServices(SERVICES, '9');
    expect(results.map(s => s.ServiceNo)).toEqual(['9', '96', '96A']);
  });

  it('returns nothing for an empty query', () => {
    expect(searchServices(SERVICES, '')).toEqual([]);
  });
});

describe('looksLikeStopCode', () => {
  it('recognises a five digit code', () => {
    expect(looksLikeStopCode('83139')).toBe(true);
    expect(looksLikeStopCode(' 01012 ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(looksLikeStopCode('8313')).toBe(false);
    expect(looksLikeStopCode('831390')).toBe(false);
    expect(looksLikeStopCode('bedok')).toBe(false);
  });
});
