import {
  haversineMeters,
  formatDistance,
  walkingMinutes,
  sortByDistance,
  canCatchBus,
} from '../geo';
import {
  favouriteKey,
  isFavourite,
  toggleFavourite,
  removeFavourite,
  reorderFavourites,
  groupByStop,
  type Favourite,
} from '../favourites';

describe('haversineMeters', () => {
  // Two real Singapore bus stops roughly 300 m apart on Victoria St.
  const grandPacific = { latitude: 1.29684825, longitude: 103.85253591 };
  const stJoseph = { latitude: 1.29770970, longitude: 103.85434686 };

  it('returns zero for the same point', () => {
    expect(haversineMeters(grandPacific, grandPacific)).toBe(0);
  });

  it('measures a short distance plausibly', () => {
    const distance = haversineMeters(grandPacific, stJoseph);
    expect(distance).toBeGreaterThan(180);
    expect(distance).toBeLessThan(260);
  });

  it('is symmetric', () => {
    expect(haversineMeters(grandPacific, stJoseph)).toBe(
      haversineMeters(stJoseph, grandPacific)
    );
  });

  it('handles a known one degree of latitude as about 111 km', () => {
    const distance = haversineMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 }
    );
    expect(distance).toBeGreaterThan(110_000);
    expect(distance).toBeLessThan(112_000);
  });
});

describe('formatDistance', () => {
  it('uses metres below a kilometre', () => {
    expect(formatDistance(250)).toBe('250 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('switches to kilometres at a thousand metres', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1234)).toBe('1.2 km');
  });
});

describe('walkingMinutes', () => {
  it('converts distance at the standard walking speed', () => {
    expect(walkingMinutes(80)).toBe(1);
    expect(walkingMinutes(400)).toBe(5);
  });

  it('rounds up rather than to nearest', () => {
    // 4.2 minutes reported as 4 could cost someone the bus.
    expect(walkingMinutes(340)).toBe(5);
  });

  it('returns zero when already there', () => {
    expect(walkingMinutes(0)).toBe(0);
  });
});

describe('sortByDistance', () => {
  const origin = { latitude: 1.3, longitude: 103.8 };
  const items = [
    { name: 'far', latitude: 1.31, longitude: 103.8 },
    { name: 'near', latitude: 1.3005, longitude: 103.8 },
    { name: 'mid', latitude: 1.302, longitude: 103.8 },
  ];

  it('returns closest first', () => {
    const sorted = sortByDistance(items, origin, 5000);
    expect(sorted.map(i => i.name)).toEqual(['near', 'mid', 'far']);
  });

  it('attaches the computed distance', () => {
    const sorted = sortByDistance(items, origin, 5000);
    expect(sorted[0].distance).toBeGreaterThan(0);
  });

  it('drops anything beyond the radius', () => {
    // 'near' is about 55 m away; 'mid' is about 220 m.
    const sorted = sortByDistance(items, origin, 100);
    expect(sorted.map(i => i.name)).toEqual(['near']);
  });

  it('respects the limit', () => {
    expect(sortByDistance(items, origin, 5000, 2)).toHaveLength(2);
  });
});

describe('canCatchBus', () => {
  it('says yes with comfortable margin', () => {
    expect(canCatchBus(3, 8)).toBe('yes');
  });

  it('says tight when the margin is small', () => {
    expect(canCatchBus(5, 6)).toBe('tight');
  });

  it('says no when the walk is longer than the wait', () => {
    expect(canCatchBus(7, 3)).toBe('no');
  });

  it('says no when arrival exactly equals walk time', () => {
    // No slack at all means it is not catchable in practice.
    expect(canCatchBus(5, 5)).toBe('no');
  });

  it('reports unknown when there is no arrival estimate', () => {
    expect(canCatchBus(4, null)).toBe('unknown');
  });
});

describe('favouriteKey', () => {
  it('distinguishes a service at a stop from the whole stop', () => {
    expect(favouriteKey({ stopCode: '83139', serviceNo: '196' })).not.toBe(
      favouriteKey({ stopCode: '83139' })
    );
  });

  it('is stable for equal favourites', () => {
    expect(favouriteKey({ stopCode: '83139', serviceNo: '196' })).toBe(
      favouriteKey({ stopCode: '83139', serviceNo: '196' })
    );
  });
});

describe('toggleFavourite', () => {
  const existing: Favourite[] = [{ stopCode: '83139', serviceNo: '196' }];

  it('adds when absent', () => {
    const next = toggleFavourite(existing, {
      stopCode: '01012',
      serviceNo: '7',
    });
    expect(next).toHaveLength(2);
  });

  it('removes when already present', () => {
    const next = toggleFavourite(existing, {
      stopCode: '83139',
      serviceNo: '196',
    });
    expect(next).toHaveLength(0);
  });

  it('does not mutate the original list', () => {
    toggleFavourite(existing, { stopCode: '01012' });
    expect(existing).toHaveLength(1);
  });

  it('treats the same service at a different stop as distinct', () => {
    const next = toggleFavourite(existing, {
      stopCode: '84009',
      serviceNo: '196',
    });
    expect(next).toHaveLength(2);
  });
});

describe('isFavourite', () => {
  const favourites: Favourite[] = [{ stopCode: '83139', serviceNo: '196' }];

  it('finds an exact match', () => {
    expect(
      isFavourite(favourites, { stopCode: '83139', serviceNo: '196' })
    ).toBe(true);
  });

  it('does not match a different service at the same stop', () => {
    expect(
      isFavourite(favourites, { stopCode: '83139', serviceNo: '197' })
    ).toBe(false);
  });
});

describe('removeFavourite', () => {
  it('removes by key', () => {
    const favourites: Favourite[] = [
      { stopCode: '83139', serviceNo: '196' },
      { stopCode: '01012' },
    ];
    const next = removeFavourite(favourites, '83139:196');
    expect(next).toHaveLength(1);
    expect(next[0].stopCode).toBe('01012');
  });
});

describe('reorderFavourites', () => {
  const favourites: Favourite[] = [
    { stopCode: 'A' },
    { stopCode: 'B' },
    { stopCode: 'C' },
  ];

  it('moves an item to a new position', () => {
    const next = reorderFavourites(favourites, 0, 2);
    expect(next.map(f => f.stopCode)).toEqual(['B', 'C', 'A']);
  });

  it('returns the list unchanged when the position is the same', () => {
    expect(reorderFavourites(favourites, 1, 1)).toBe(favourites);
  });

  it('ignores out of range indices rather than throwing', () => {
    expect(reorderFavourites(favourites, 5, 0)).toBe(favourites);
    expect(reorderFavourites(favourites, 0, 9)).toBe(favourites);
  });
});

describe('groupByStop', () => {
  it('collects services saved at the same stop', () => {
    const favourites: Favourite[] = [
      { stopCode: '83139', serviceNo: '196' },
      { stopCode: '83139', serviceNo: '15' },
      { stopCode: '01012', serviceNo: '7' },
    ];

    const groups = groupByStop(favourites);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      stopCode: '83139',
      services: ['196', '15'],
    });
  });

  it('represents a whole-stop favourite with no services', () => {
    const groups = groupByStop([{ stopCode: '83139' }]);
    expect(groups[0].services).toEqual([]);
  });
});
