/**
 * A thin inline notice.
 *
 * Used to explain degraded states rather than hiding them: showing
 * cached data without saying so is worse than saying so, because the
 * user cannot tell whether the times are current.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Palette } from '../theme/tokens';
import { space, type } from '../theme/tokens';

export type BannerTone = 'info' | 'warning';

interface Props {
  palette: Palette;
  message: string;
  tone?: BannerTone;
  /** Optional inline action, e.g. "Retry". */
  actionLabel?: string;
  onAction?: () => void;
}

export function Banner({
  palette,
  message,
  tone = 'info',
  actionLabel,
  onAction,
}: Props) {
  const accent = tone === 'warning' ? palette.boardText : palette.accent;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: palette.surfaceAlt,
          borderLeftColor: accent,
        },
      ]}
    >
      <Text style={[type.caption, styles.message, { color: palette.text }]}>
        {message}
      </Text>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[type.caption, styles.action, { color: accent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderLeftWidth: 3,
  },
  message: {
    flex: 1,
  },
  action: {
    fontWeight: '600',
  },
});
