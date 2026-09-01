/**
 * Bus stops near the user, closest first.
 *
 * This answers the question people actually have when they open a bus
 * app: not "which stop is 83139" but "which stop am I standing at".
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBusData } from '../../src/context/BusDataContext';
import { useLocation } from '../../src/hooks/useLocation';
import { StopRow } from '../../src/components/StopRow';
import { useTheme } from '../../src/theme/useTheme';
import { space, radius, type } from '../../src/theme/tokens';
import {
  sortByDistance,
  formatDistance,
  walkingMinutes,
} from '../../src/utils/geo';

/** Stops beyond this are not worth walking to. */
const SEARCH_RADIUS_M = 800;

export default function NearbyScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { status: dataStatus, stops } = useBusData();
  const { status: locationStatus, coords, request } = useLocation();

  const nearby = useMemo(() => {
    if (!coords || stops.length === 0) return [];
    return sortByDistance(stops, coords, SEARCH_RADIUS_M, 20);
  }, [coords, stops]);

  const isLoading =
    dataStatus === 'downloading' ||
    dataStatus === 'loading-cache' ||
    locationStatus === 'requesting';

  if (isLoading) {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} />
        <Text style={[type.body, { color: palette.textMuted }]}>
          {dataStatus === 'downloading'
            ? 'Downloading bus stops'
            : 'Finding your location'}
        </Text>
      </View>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Text style={[type.heading, { color: palette.text }]}>
          Location is off
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          Allow location access to see the stops around you. You can still
          find any stop using search.
        </Text>
        <Pressable
          onPress={request}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: palette.accent }]}
        >
          <Text style={[type.body, styles.buttonText]}>Allow location</Text>
        </Pressable>
      </View>
    );
  }

  if (locationStatus === 'ready' && nearby.length === 0) {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Text style={[type.heading, { color: palette.text }]}>
          No stops nearby
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          Nothing within {formatDistance(SEARCH_RADIUS_M)} of you. Try search
          instead.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={nearby}
        keyExtractor={item => item.BusStopCode}
        refreshControl={
          <RefreshControl
            refreshing={locationStatus === 'requesting'}
            onRefresh={request}
            tintColor={palette.textMuted}
          />
        }
        ListHeaderComponent={
          <Text
            style={[
              type.caption,
              styles.header,
              { color: palette.textMuted },
            ]}
          >
            {nearby.length} stops within {formatDistance(SEARCH_RADIUS_M)}
          </Text>
        }
        renderItem={({ item }) => (
          <StopRow
            stop={item}
            palette={palette}
            distanceLabel={`${formatDistance(item.distance)} · ${walkingMinutes(
              item.distance
            )} min`}
            onPress={() => router.push(`/stop/${item.BusStopCode}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  centreText: { textAlign: 'center' },
  button: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
