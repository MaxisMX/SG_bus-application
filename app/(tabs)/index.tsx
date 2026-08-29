/**
 * Temporary development launcher.
 *
 * Placeholder while the search and nearby screens are built: a phone has
 * no address bar, so this provides a way to reach known stops directly.
 */

import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme/useTheme';
import { space, type } from '../../src/theme/tokens';

/** Stops used during development, spread across different operators. */
const TEST_STOPS = [
  { code: '83139', name: 'Opp Bedok Stn Exit B' },
  { code: '01012', name: 'Hotel Grand Pacific' },
  { code: '84009', name: 'Bedok Int' },
];

export default function HomeScreen() {
  const { palette } = useTheme();

  return (
    <View style={[styles.page, { backgroundColor: palette.background }]}>
      <Text style={[type.heading, { color: palette.textMuted }]}>
        Development stops
      </Text>

      {TEST_STOPS.map(stop => (
        <Link
          key={stop.code}
          href={`/stop/${stop.code}`}
          style={[styles.row, { borderBottomColor: palette.border }]}
        >
          <Text style={[type.body, { color: palette.accent }]}>
            {stop.code} · {stop.name}
          </Text>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: space.xl,
    gap: space.md,
  },
  row: {
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});