/**
 * Component tests for the arrival board's presentational pieces.
 *
 * Both components live in one file deliberately: they are rendered
 * together in the real screen, and several assertions here concern how
 * they combine.
 *
 * Queries are taken from each render result rather than the shared
 * `screen` object, so every case is independent of module-level state.
 */

import { render, fireEvent } from '@testing-library/react-native';
import { LoadGauge } from '../LoadGauge';
import { ArrivalRow } from '../ArrivalRow';
import { palettes } from '../../theme/tokens';
import type { ArrivalService, NextBus, BusLoad } from '../../types/lta';

const palette = palettes.light;

/** Fixed clock so countdowns are deterministic. */
const NOW = new Date('2024-08-22T15:20:00+08:00');

/**
 * The gauge is deliberately hidden from the accessibility tree, and the
 * testing library skips hidden elements by default, so these queries opt
 * back in explicitly.
 */
const HIDDEN = { includeHiddenElements: true } as const;

function bus(overrides: Partial<NextBus> = {}): NextBus {
  return {
    OriginCode: '10009',
    DestinationCode: '45009',
    EstimatedArrival: '2024-08-22T15:27:00+08:00',
    Monitored: 1,
    Latitude: '1.31',
    Longitude: '103.75',
    VisitNumber: '1',
    Load: 'SEA',
    Feature: 'WAB',
    Type: 'DD',
    ...overrides,
  };
}

function service(overrides: Partial<ArrivalService> = {}): ArrivalService {
  return {
    ServiceNo: '196',
    Operator: 'SBST',
    NextBus: bus(),
    NextBus2: bus({ EstimatedArrival: '2024-08-22T15:35:00+08:00' }),
    NextBus3: bus({ EstimatedArrival: '2024-08-22T15:48:00+08:00' }),
    ...overrides,
  };
}

/** Render a gauge and report what a user would perceive. */
function renderGauge(load: BusLoad) {
  const view = render(<LoadGauge load={load} palette={palette} />);

  return {
    ...view,
    filled: () => view.queryAllByTestId('gauge-segment-filled', HIDDEN).length,
    total: () =>
      view.queryAllByTestId('gauge-segment-filled', HIDDEN).length +
      view.queryAllByTestId('gauge-segment-empty', HIDDEN).length,
  };
}

/** Render an arrival row with sensible defaults. */
function renderRow(props: Partial<Parameters<typeof ArrivalRow>[0]> = {}) {
  return render(
    <ArrivalRow service={service()} now={NOW} palette={palette} {...props} />
  );
}

describe('LoadGauge', () => {
  it('fills all three segments when seats are available', () => {
    expect(renderGauge('SEA').filled()).toBe(3);
  });

  it('fills two segments for standing available', () => {
    expect(renderGauge('SDA').filled()).toBe(2);
  });

  it('fills one segment for limited standing', () => {
    expect(renderGauge('LSD').filled()).toBe(1);
  });

  it('fills nothing when crowding is not reported', () => {
    expect(renderGauge('').filled()).toBe(0);
  });

  it('always renders three segments regardless of level', () => {
    expect(renderGauge('LSD').total()).toBe(3);
  });

  it('shows a fuller gauge for an emptier bus', () => {
    // The direction of the mapping matters: more segments must mean
    // more room, not more crowding.
    const seats = renderGauge('SEA').filled();
    const crowded = renderGauge('LSD').filled();

    expect(crowded).toBeLessThan(seats);
  });

  it('is hidden from screen readers, since the row describes it', () => {
    const { getByTestId } = renderGauge('SEA');

    expect(
      getByTestId('load-gauge', HIDDEN).props.accessibilityElementsHidden
    ).toBe(true);
  });
});

describe('ArrivalRow', () => {
  it('shows the service number and countdown', () => {
    const { getByText } = renderRow();

    expect(getByText('196')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
  });

  it('shows the following two arrivals', () => {
    const { getByText } = renderRow();

    expect(getByText('15')).toBeTruthy();
    expect(getByText('28')).toBeTruthy();
  });

  it('shows Arr instead of zero for a bus arriving now', () => {
    const { getByText } = renderRow({
      service: service({
        NextBus: bus({ EstimatedArrival: '2024-08-22T15:20:30+08:00' }),
      }),
    });

    expect(getByText('Arr')).toBeTruthy();
  });

  it('shows a dash when a following bus has no estimate', () => {
    const { getByText } = renderRow({
      service: service({ NextBus3: bus({ EstimatedArrival: '' }) }),
    });

    expect(getByText('-')).toBeTruthy();
  });

  it('describes the arrival in one sentence for screen readers', () => {
    const { getByLabelText } = renderRow();

    expect(
      getByLabelText('Bus 196, arriving in 7 minutes, seats, double deck.')
    ).toBeTruthy();
  });

  it('dims the numeral when the bus is not GPS tracked', () => {
    const { getByText } = renderRow({
      service: service({ NextBus: bus({ Monitored: 0 }) }),
    });

    const eta = getByText('7');
    const style = Array.isArray(eta.props.style)
      ? Object.assign({}, ...eta.props.style.filter(Boolean))
      : eta.props.style;

    expect(style.color).toBe(palette.boardTextDim);
  });

  describe('save button', () => {
    it('is absent when no save handler is given', () => {
      const { queryByLabelText } = renderRow();
      expect(queryByLabelText(/Save bus/)).toBeNull();
    });

    it('offers to save when not already saved', () => {
      const { getByLabelText } = renderRow({
        isSaved: false,
        onToggleSave: () => {},
      });

      expect(getByLabelText('Save bus 196')).toBeTruthy();
    });

    it('offers to remove when already saved', () => {
      const { getByLabelText } = renderRow({
        isSaved: true,
        onToggleSave: () => {},
      });

      expect(getByLabelText('Remove bus 196 from saved')).toBeTruthy();
    });

    it('calls the handler when tapped', () => {
      const onToggleSave = jest.fn();
      const { getByLabelText } = renderRow({ isSaved: false, onToggleSave });

      fireEvent.press(getByLabelText('Save bus 196'));
      expect(onToggleSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('catchability verdict', () => {
    const VERDICT = /make it|walk fast|Too far/;

    it('is absent when the walking time is unknown', () => {
      const { queryByText } = renderRow();
      expect(queryByText(VERDICT)).toBeNull();
    });

    it('says you can make it with comfortable margin', () => {
      // Bus in 7 minutes, 2 minute walk.
      const { getByText } = renderRow({ walkMinutes: 2 });
      expect(getByText('You can make it')).toBeTruthy();
    });

    it('warns when the margin is tight', () => {
      // Bus in 7 minutes, 6 minute walk.
      const { getByText } = renderRow({ walkMinutes: 6 });
      expect(getByText('Tight, walk fast')).toBeTruthy();
    });

    it('advises catching the next bus when too far', () => {
      // Bus in 7 minutes, 12 minute walk.
      const { getByText } = renderRow({ walkMinutes: 12 });
      expect(getByText('Too far, catch the next')).toBeTruthy();
    });

    it('stays silent rather than guessing when there is no estimate', () => {
      const { queryByText } = renderRow({
        service: service({ NextBus: bus({ EstimatedArrival: '' }) }),
        walkMinutes: 3,
      });

      expect(queryByText(VERDICT)).toBeNull();
    });
  });
});
