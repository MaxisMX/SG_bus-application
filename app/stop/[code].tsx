/**
 * Arrival board for a single bus stop.
 *
 * Route: /stop/83139
 *
 * Handles four states explicitly, because the LTA feed goes quiet
 * overnight and an unexplained blank screen reads as a broken app:
 * loading, ready, empty (no buses running), and error.
 *
 * When location is available, each service also shows whether it can
 * still be caught on foot from where the user is standing.
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useArrivals } from '../../src/hooks/useArrivals';
import { useLocation } from '../../src/hooks/useLocation';
import { useBusData } from '../../src/context/BusDataContext';
import { useFavourites } from '../../src/context/FavouritesContext';
import { ArrivalRow } from '../../src/components/ArrivalRow';
import { useTheme } from '../../src/theme/useTheme';
import { space, type } from '../../src/theme/tokens';
import { compareServiceNo } from '../../src/utils/search';
import {
  stopCoordinates,
  haversineMeters,
  walkingMinutes,
  formatDistance,
} from '../../src/utils/geo';

export default function StopScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { palette } = useTheme();

  const { stops } = useBusData();
  const { has, toggle } = useFavourites();
  const { coords } = useLocation();

  const { status, services, now, lastUpdated, error, isEmpty, refresh } =
    useArrivals(code);

  const stop = stops.find(candidate => candidate.BusStopCode === code);

  /**
   * How far the user is from this stop, when both positions are known.
   * Undefined rather than zero when unknown, so the row can tell the
   * difference between "you are here" and "we have no idea".
   */
  const walk = useMemo(() => {
    if (!coords || !stop) return undefined;

    const meters = haversineMeters(coords, stopCoordinates(stop));
    return { meters, minutes: walkingMinutes(meters) };
  }, [coords, stop]);

  // LTA returns services in arbitrary order; sort so the list does not
  // reshuffle between refreshes.
  const sorted = useMemo(
    () =>
      [...services].sort((a, b) =>
        compareServiceNo(a.ServiceNo, b.ServiceNo)
      ),
    [services]
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen
        options={{ title: stop?.Description ?? `Stop ${code ?? ''}` }}
      />

      {stop ? (
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <Text style={[type.caption, { color: palette.textMuted }]}>
            {stop.RoadName} · {stop.BusStopCode}
            {walk
              ? ` · ${formatDistance(walk.meters)} away, ${walk.minutes} min walk`
              : ''}
          </Text>
        </View>
      ) : null}

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
            style={[type.body, styles.centreText, { color: palette.textMuted }]}
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
            style={[type.body, styles.centreText, { color: palette.textMuted }]}
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
          renderItem={({ item }) => {
            const favourite = {
              stopCode: code ?? '',
              serviceNo: item.ServiceNo,
            };

            return (
              <ArrivalRow
                service={item}
                now={now}
                palette={palette}
                walkMinutes={walk?.minutes}
                isSaved={has(favourite)}
                onToggleSave={() => toggle(favourite)}
                onPress={() => router.push(`/service/${item.ServiceNo}`)}
              />
            );
          }}
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
                Updated{' '}
                {lastUpdated.toLocaleTimeString([], {
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
  header: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
