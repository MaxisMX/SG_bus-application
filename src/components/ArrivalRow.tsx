/**
 * One bus service at one stop.
 *
 * Layout: service number on the left, the next three arrivals on a dark
 * "board" on the right, echoing the amber dot-matrix panels at Singapore
 * bus stops. The first arrival is largest because it is the only one
 * most people read.
 *
 * When the user's walking time to the stop is known, a verdict appears
 * telling them whether the bus is still catchable.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ArrivalService, NextBus } from '../types/lta';
import type { Palette } from '../theme/tokens';
import { space, radius, type } from '../theme/tokens';
import { formatEta, isBusUnavailable, minutesUntil } from '../utils/time';
import {
  arrivalAccessibilityLabel,
  busTypeGlyph,
  describeOperator,
} from '../utils/display';
import { canCatchBus } from '../utils/geo';
import { LoadGauge } from './LoadGauge';

interface Props {
  service: ArrivalService;
  /** Ticks every second so countdowns stay live between fetches. */
  now: Date;
  palette: Palette;
  onPress?: () => void;
  /** Whether this service is saved at this stop. */
  isSaved?: boolean;
  onToggleSave?: () => void;
  /** Minutes to walk here, when the user's location is known. */
  walkMinutes?: number;
}

export function ArrivalRow({
  service,
  now,
  palette,
  onPress,
  isSaved,
  onToggleSave,
  walkMinutes,
}: Props) {
  const { NextBus: first, NextBus2: second, NextBus3: third } = service;

  const firstEta = formatEta(first?.EstimatedArrival, now);
  const isArriving = firstEta === 'Arr';

  // Monitored = 0 means LTA estimated this from the timetable rather
  // than tracking the bus, so it is shown dimmed to set expectations.
  const isTracked = first?.Monitored === 1;

  const verdict =
    walkMinutes === undefined
      ? null
      : canCatchBus(walkMinutes, minutesUntil(first?.EstimatedArrival, now));

  const label = arrivalAccessibilityLabel({
    serviceNo: service.ServiceNo,
    eta: firstEta,
    load: first?.Load ?? '',
    busType: first?.Type ?? '',
    monitored: isTracked,
  });

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={label}
        accessibilityHint={
          onPress ? 'Shows the full route for this service' : undefined
        }
        style={styles.main}
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
          {verdict && verdict !== 'unknown' ? (
            <CatchVerdict verdict={verdict} palette={palette} />
          ) : null}
        </View>

        <LoadGauge load={first?.Load ?? ''} palette={palette} />

        <View style={[styles.board, { backgroundColor: palette.board }]}>
          <Text
            style={[
              type.eta,
              { color: isTracked ? palette.boardText : palette.boardTextDim },
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

      {onToggleSave ? (
        <Pressable
          onPress={onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={
            isSaved
              ? `Remove bus ${service.ServiceNo} from saved`
              : `Save bus ${service.ServiceNo}`
          }
          // Enlarged touch area: the icon itself is too small a target
          // for a one-handed tap on a moving bus.
          hitSlop={10}
          style={styles.saveButton}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? palette.accent : palette.textFaint}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Whether the bus is still catchable on foot.
 *
 * Phrased as an instruction rather than a status, since that is what the
 * user needs in the moment.
 */
function CatchVerdict({
  verdict,
  palette,
}: {
  verdict: 'yes' | 'tight' | 'no';
  palette: Palette;
}) {
  const config = {
    yes: { text: 'You can make it', color: palette.gaugeFill },
    tight: { text: 'Tight, walk fast', color: palette.boardText },
    no: { text: 'Too far, catch the next', color: palette.textFaint },
  }[verdict];

  return (
    <Text style={[type.caption, { color: config.color }]} numberOfLines={1}>
      {config.text}
    </Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingLeft: space.lg,
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
  saveButton: {
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
  },
});
