/**
 * Loading placeholders.
 *
 * A skeleton that mirrors the shape of the content being loaded reads as
 * "nearly there", whereas a centred spinner reads as "something is
 * happening somewhere". The perceived wait is shorter even though the
 * actual wait is identical.
 */

import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import type { Palette } from '../theme/tokens';
import { space, radius } from '../theme/tokens';

interface BlockProps {
  palette: Palette;
  width?: number | `${number}%`;
  height?: number;
}

/**
 * A single grey block that pulses gently.
 *
 * Uses the native driver so the animation runs off the JS thread and
 * keeps moving even while the response is being parsed.
 */
export function SkeletonBlock({ palette, width = '100%', height = 14 }: BlockProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.block,
        { backgroundColor: palette.surfaceAlt, width, height, opacity },
      ]}
    />
  );
}

/**
 * Placeholder shaped like an arrival row: service number on the left,
 * arrival board on the right.
 */
export function ArrivalRowSkeleton({ palette }: { palette: Palette }) {
  return (
    <View
      style={[styles.row, { borderBottomColor: palette.border }]}
      accessibilityLabel="Loading arrivals"
    >
      <View style={styles.identity}>
        <SkeletonBlock palette={palette} width={52} height={20} />
        <SkeletonBlock palette={palette} width={80} height={10} />
      </View>
      <SkeletonBlock palette={palette} width={116} height={38} />
    </View>
  );
}

/** Placeholder shaped like a stop row. */
export function StopRowSkeleton({ palette }: { palette: Palette }) {
  return (
    <View
      style={[styles.row, { borderBottomColor: palette.border }]}
      accessibilityLabel="Loading stops"
    >
      <View style={styles.identity}>
        <SkeletonBlock palette={palette} width="70%" height={15} />
        <SkeletonBlock palette={palette} width="45%" height={10} />
      </View>
      <SkeletonBlock palette={palette} width={48} height={12} />
    </View>
  );
}

/** Several placeholder rows, for a list that is still loading. */
export function SkeletonList({
  palette,
  count = 6,
  variant = 'arrival',
}: {
  palette: Palette;
  count?: number;
  variant?: 'arrival' | 'stop';
}) {
  const Row = variant === 'arrival' ? ArrivalRowSkeleton : StopRowSkeleton;

  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <Row key={index} palette={palette} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.sm,
  },
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
    gap: space.sm,
  },
});
