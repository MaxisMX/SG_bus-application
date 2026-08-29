/**
 * One bus service at one stop.
 *
 * Layout: service number on the left, the next three arrivals on a dark
 * "board" on the right, echoing the amber dot-matrix panels at Singapore
 * bus stops. The first arrival is largest because it is the only one
 * most people read.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ArrivalService, NextBus } from '../types/lta';
import type { Palette } from '../theme/tokens';
import { space, radius, type } from '../theme/tokens';
import { formatEta, isBusUnavailable } from '../utils/time';
import {
  arrivalAccessibilityLabel,
  busTypeGlyph,
  describeOperator,
} from '../utils/display';
import { LoadGauge } from './LoadGauge';

interface Props {
  service: ArrivalService;
  /** Ticks every second so countdowns stay live between fetches. */
  now: Date;
  palette: Palette;
  onPress?: () => void;
}

export function ArrivalRow({ service, now, palette, onPress }: Props) {
  const { NextBus: first, NextBus2: second, NextBus3: third } = service;

  const firstEta = formatEta(first?.EstimatedArrival, now);
  const isArriving = firstEta === 'Arr';

  // Monitored = 0 means LTA estimated this from the timetable rather
  // than tracking the bus, so it is shown dimmed to set expectations.
  const isTracked = first?.Monitored === 1;

  const label = arrivalAccessibilityLabel({
    serviceNo: service.ServiceNo,
    eta: firstEta,
    load: first?.Load ?? '',
    busType: first?.Type ?? '',
    monitored: isTracked,
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      accessibilityHint={
        onPress ? 'Shows the full route for this service' : undefined
      }
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <View style={styles.identity}>
        <Text style={[type.service, { color: palette.text }]}>
          {service.ServiceNo}
        </Text>
        <Text
          style={[type.caption, { color: palette.textFaint }]}
          numberOfLines={1}
        >
          {describeOperator(service.Operator)}
          {first?.Type ? `  ${busTypeGlyph(first.Type)}` : ''}
        </Text>
      </View>

      <LoadGauge load={first?.Load ?? ''} palette={palette} />

      <View style={[styles.board, { backgroundColor: palette.board }]}>
        <Text
          style={[
            type.eta,
            {
              color: isTracked ? palette.boardText : palette.boardTextDim,
            },
            // Arriving buses get slightly tighter type so 'Arr' fits the
            // same slot two digits occupy.
            isArriving && styles.arriving,
          ]}
        >
          {firstEta}
        </Text>

        <View style={styles.following}>
          <FollowingEta bus={second} now={now} palette={palette} />
          <FollowingEta bus={third} now={now} palette={palette} />
        </View>
      </View>
    </Pressable>
  );
}

/** A smaller numeral for the second and third buses. */
function FollowingEta({
  bus,
  now,
  palette,
}: {
  bus: NextBus | undefined;
  now: Date;
  palette: Palette;
}) {
  if (isBusUnavailable(bus)) {
    return (
      <Text style={[type.etaSmall, { color: palette.boardTextDim }]}>-</Text>
    );
  }

  return (
    <Text
      style={[
        type.etaSmall,
        {
          color:
            bus?.Monitored === 1 ? palette.boardText : palette.boardTextDim,
        },
      ]}
    >
      {formatEta(bus?.EstimatedArrival, now)}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    minWidth: 116,
    justifyContent: 'flex-end',
  },
  arriving: {
    fontSize: 18,
  },
  following: {
    alignItems: 'flex-end',
    gap: 1,
    minWidth: 26,
  },
});
