/**
 * Arrival board for a single bus stop.
 *
 * Route: /stop/83139
 *
 * Handles four states explicitly, because the LTA feed goes quiet
 * overnight and an unexplained blank screen reads as a broken app:
 * loading, ready, empty (no buses running), and error.
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useArrivals } from '../../src/hooks/useArrivals';
import { ArrivalRow } from '../../src/components/ArrivalRow';
import { useTheme } from '../../src/theme/useTheme';
import { space, type } from '../../src/theme/tokens';
import { compareServiceNo } from '../../src/utils/search';

export default function StopScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { palette } = useTheme();

  const { status, services, now, lastUpdated, error, isEmpty, refresh } =
    useArrivals(code);

  // LTA returns services in arbitrary order; sort so the list does not
  // reshuffle between refreshes.
  const sorted = useMemo(
    () => [...services].sort((a, b) => compareServiceNo(a.ServiceNo, b.ServiceNo)),
    [services]
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: `Stop ${code ?? ''}` }} />

      {status === 'loading' && (
        <View style={styles.centre}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[type.body, { color: palette.textMuted }]}>
            Checking arrivals
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centre}>
          <Text style={[type.heading, { color: palette.text }]}>
            No arrival data
          </Text>
          <Text
            style={[
              type.body,
              styles.centreText,
              { color: palette.textMuted },
            ]}
          >
            {error}
          </Text>
          <Text
            onPress={refresh}
            accessibilityRole="button"
            style={[type.body, { color: palette.accent }]}
          >
            Try again
          </Text>
        </View>
      )}

      {isEmpty && (
        <View style={styles.centre}>
          <Text style={[type.heading, { color: palette.text }]}>
            No buses running
          </Text>
          <Text
            style={[
              type.body,
              styles.centreText,
              { color: palette.textMuted },
            ]}
          >
            Services at this stop have finished for the night. Pull down to
            check again.
          </Text>
        </View>
      )}

      {sorted.length > 0 && (
        <FlatList
          data={sorted}
          keyExtractor={item => item.ServiceNo}
          renderItem={({ item }) => (
            <ArrivalRow service={item} now={now} palette={palette} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={status === 'refreshing'}
              onRefresh={refresh}
              tintColor={palette.textMuted}
            />
          }
          ListFooterComponent={
            lastUpdated ? (
              <Text
                style={[
                  type.caption,
                  styles.footer,
                  { color: palette.textFaint },
                ]}
              >
                Updated {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  centreText: {
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    paddingVertical: space.lg,
  },
});
