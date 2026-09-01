/**
 * One bus stop in a list.
 *
 * The description is what people actually recognise ("Opp Bedok Stn"),
 * so it leads. The road name and code are supporting detail, since two
 * stops on opposite sides of a road often share a similar description.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BusStop } from '../types/lta';
import type { Palette } from '../theme/tokens';
import { space, type, monoFont } from '../theme/tokens';

interface Props {
  stop: BusStop;
  palette: Palette;
  onPress: () => void;
  /** Optional walking distance, shown when the user's location is known. */
  distanceLabel?: string;
}

export function StopRow({ stop, palette, onPress, distanceLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${stop.Description}, ${stop.RoadName}, stop ${stop.BusStopCode}${
        distanceLabel ? `, ${distanceLabel} away` : ''
      }`}
      accessibilityHint="Shows bus arrivals at this stop"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
          borderBottomColor: palette.border,
        },
      ]}
    >
      <View style={styles.details}>
        <Text
          style={[type.body, styles.name, { color: palette.text }]}
          numberOfLines={1}
        >
          {stop.Description}
        </Text>
        <Text
          style={[type.caption, { color: palette.textMuted }]}
          numberOfLines={1}
        >
          {stop.RoadName}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={[styles.code, { color: palette.textFaint }]}>
          {stop.BusStopCode}
        </Text>
        {distanceLabel ? (
          <Text style={[type.caption, { color: palette.textMuted }]}>
            {distanceLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  meta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  code: {
    fontFamily: monoFont,
    fontSize: 13,
  },
});
