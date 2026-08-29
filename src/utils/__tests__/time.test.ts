import {
  minutesUntil,
  formatEta,
  formatClockTime,
  isBusUnavailable,
  describeLoad,
  parseHHMM,
} from '../time';
import type { NextBus } from '../../types/lta';

// A fixed "now" so these tests never depend on the real clock.
const NOW = new Date('2024-08-22T15:20:00+08:00');

describe('minutesUntil', () => {
  it('returns whole minutes for a future arrival', () => {
    expect(minutesUntil('2024-08-22T15:27:15+08:00', NOW)).toBe(7);
  });

  it('rounds down rather than up, so a bus is never announced early', () => {
    // 6 minutes 59 seconds away should read as 6, not 7.
    expect(minutesUntil('2024-08-22T15:26:59+08:00', NOW)).toBe(6);
  });

  it('returns 0 for a bus arriving within the next minute', () => {
    expect(minutesUntil('2024-08-22T15:20:45+08:00', NOW)).toBe(0);
  });

  it('returns 0 for a timestamp already in the past', () => {
    // The bus is at the stop now; this is not an error condition.
    expect(minutesUntil('2024-08-22T15:18:00+08:00', NOW)).toBe(0);
  });

  it('returns null when LTA sends an empty string', () => {
    expect(minutesUntil('', NOW)).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(minutesUntil(null, NOW)).toBeNull();
    expect(minutesUntil(undefined, NOW)).toBeNull();
  });

  it('returns null for a malformed timestamp', () => {
    expect(minutesUntil('not a date', NOW)).toBeNull();
  });

  it('handles the +08:00 offset correctly from any device timezone', () => {
    // Same instant expressed as UTC must give the same answer.
    expect(minutesUntil('2024-08-22T07:27:15Z', NOW)).toBe(7);
  });
});

describe('formatEta', () => {
  it('shows Arr for a bus arriving now', () => {
    expect(formatEta('2024-08-22T15:20:30+08:00', NOW)).toBe('Arr');
  });

  it('shows Arr for a bus already at the stop', () => {
    expect(formatEta('2024-08-22T15:19:00+08:00', NOW)).toBe('Arr');
  });

  it('shows the minute count for a future bus', () => {
    expect(formatEta('2024-08-22T15:32:00+08:00', NOW)).toBe('12');
  });

  it('shows a dash when there is no data', () => {
    expect(formatEta('', NOW)).toBe('-');
  });
});

describe('formatClockTime', () => {
  it('formats to 24-hour clock time', () => {
    // Rendered in the device timezone; assert the shape rather than a
    // fixed string so the test is not machine-dependent.
    expect(formatClockTime('2024-08-22T15:27:15+08:00')).toMatch(
      /^\d{2}:\d{2}$/
    );
  });

  it('shows a dash for missing input', () => {
    expect(formatClockTime('')).toBe('-');
  });
});

describe('isBusUnavailable', () => {
  const bus = (overrides: Partial<NextBus> = {}): NextBus => ({
    OriginCode: '10009',
    DestinationCode: '45009',
    EstimatedArrival: '2024-08-22T15:27:15+08:00',
    Monitored: 1,
    Latitude: '1.31',
    Longitude: '103.75',
    VisitNumber: '1',
    Load: 'SEA',
    Feature: 'WAB',
    Type: 'DD',
    ...overrides,
  });

  it('is false when a real arrival time is present', () => {
    expect(isBusUnavailable(bus())).toBe(false);
  });

  it('is true when EstimatedArrival is an empty string', () => {
    expect(isBusUnavailable(bus({ EstimatedArrival: '' }))).toBe(true);
  });

  it('is true for a missing bus object', () => {
    expect(isBusUnavailable(undefined)).toBe(true);
  });
});

describe('describeLoad', () => {
  it('maps each documented crowding code to a readable label', () => {
    expect(describeLoad('SEA')).toBe('Seats available');
    expect(describeLoad('SDA')).toBe('Standing available');
    expect(describeLoad('LSD')).toBe('Limited standing');
  });

  it('falls back gracefully when crowding is not reported', () => {
    expect(describeLoad('')).toBe('Crowding unknown');
  });
});

describe('parseHHMM', () => {
  it('converts a first-bus time to minutes since midnight', () => {
    expect(parseHHMM('0500')).toBe(300);
  });

  it('converts a last-bus time to minutes since midnight', () => {
    expect(parseHHMM('2300')).toBe(1380);
  });

  it('accepts hours past midnight for late-night services', () => {
    expect(parseHHMM('2430')).toBe(1470);
  });

  it('returns null for the dash LTA uses when a service does not run', () => {
    expect(parseHHMM('-')).toBeNull();
  });

  it('returns null for malformed values', () => {
    expect(parseHHMM('99')).toBeNull();
    expect(parseHHMM('abcd')).toBeNull();
    expect(parseHHMM('')).toBeNull();
  });
});
