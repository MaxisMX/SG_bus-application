import {
  loadLevel,
  loadLabel,
  describeBusType,
  describeOperator,
  arrivalAccessibilityLabel,
} from '../display';

describe('loadLevel', () => {
  it('maps seats available to a full gauge', () => {
    expect(loadLevel('SEA')).toBe(3);
  });

  it('maps standing available to two segments', () => {
    expect(loadLevel('SDA')).toBe(2);
  });

  it('maps limited standing to one segment', () => {
    expect(loadLevel('LSD')).toBe(1);
  });

  it('shows an empty gauge when crowding is not reported', () => {
    expect(loadLevel('')).toBe(0);
  });

  it('orders the levels so emptier buses always score higher', () => {
    expect(loadLevel('SEA')).toBeGreaterThan(loadLevel('SDA'));
    expect(loadLevel('SDA')).toBeGreaterThan(loadLevel('LSD'));
  });
});

describe('loadLabel', () => {
  it('gives a short readable label for each code', () => {
    expect(loadLabel('SEA')).toBe('Seats');
    expect(loadLabel('SDA')).toBe('Standing');
    expect(loadLabel('LSD')).toBe('Crowded');
  });

  it('gives an empty label when crowding is unknown', () => {
    expect(loadLabel('')).toBe('');
  });
});

describe('describeBusType', () => {
  it('expands each vehicle code', () => {
    expect(describeBusType('SD')).toBe('Single deck');
    expect(describeBusType('DD')).toBe('Double deck');
    expect(describeBusType('BD')).toBe('Bendy bus');
  });

  it('returns nothing for an unreported type', () => {
    expect(describeBusType('')).toBe('');
  });
});

describe('describeOperator', () => {
  it('expands the four Singapore operators', () => {
    expect(describeOperator('SBST')).toBe('SBS Transit');
    expect(describeOperator('SMRT')).toBe('SMRT Buses');
    expect(describeOperator('TTS')).toBe('Tower Transit');
    expect(describeOperator('GAS')).toBe('Go-Ahead Singapore');
  });

  it('falls back to the raw code if LTA adds a new operator', () => {
    expect(describeOperator('NEWCO')).toBe('NEWCO');
  });
});

describe('arrivalAccessibilityLabel', () => {
  it('reads out a normal arrival as one sentence', () => {
    const label = arrivalAccessibilityLabel({
      serviceNo: '196',
      eta: '7',
      load: 'SEA',
      busType: 'DD',
      monitored: true,
    });

    expect(label).toBe(
      'Bus 196, arriving in 7 minutes, seats, double deck.'
    );
  });

  it('says arriving now rather than reading a number', () => {
    const label = arrivalAccessibilityLabel({
      serviceNo: '96',
      eta: 'Arr',
      load: 'LSD',
      busType: 'SD',
      monitored: true,
    });

    expect(label).toContain('arriving now');
    expect(label).not.toContain('minutes');
  });

  it('flags estimates that are not GPS tracked', () => {
    const label = arrivalAccessibilityLabel({
      serviceNo: '10',
      eta: '12',
      load: '',
      busType: '',
      monitored: false,
    });

    expect(label).toContain('estimated from timetable');
  });

  it('does not claim an estimate when there is no time at all', () => {
    const label = arrivalAccessibilityLabel({
      serviceNo: '10',
      eta: '-',
      load: '',
      busType: '',
      monitored: false,
    });

    expect(label).toContain('no arrival time available');
    expect(label).not.toContain('estimated from timetable');
  });

  it('omits crowding and vehicle detail when LTA does not report them', () => {
    const label = arrivalAccessibilityLabel({
      serviceNo: '7',
      eta: '3',
      load: '',
      busType: '',
      monitored: true,
    });

    expect(label).toBe('Bus 7, arriving in 3 minutes.');
  });
});
