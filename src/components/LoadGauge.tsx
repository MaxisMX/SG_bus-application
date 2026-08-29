/**
 * Crowding shown as three stacked segments.
 *
 * Deliberately not a traffic light: filled-segment count carries the
 * information, so it still reads in greyscale and for colour blind
 * users. Colour is a secondary cue, not the only one.
 */

import { View, StyleSheet } from 'react-native';
import type { BusLoad } from '../types/lta';
import { loadLevel } from '../utils/display';
import type { Palette } from '../theme/tokens';

interface Props {
  load: BusLoad;
  palette: Palette;
}

const SEGMENTS = 3;

export function LoadGauge({ load, palette }: Props) {
  const level = loadLevel(load);

  return (
    <View
      style={styles.container}
      // The parent row carries the spoken description, so this purely
      // decorative duplicate is hidden from screen readers.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: SEGMENTS }, (_, index) => {
        // Fill from the bottom up, so a fuller bar means more room.
        const isFilled = SEGMENTS - index <= level;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: isFilled
                  ? palette.gaugeFill
                  : palette.gaugeTrack,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    gap: 2,
    width: 4,
    height: 22,
  },
  segment: {
    flex: 1,
    borderRadius: 1,
  },
});
