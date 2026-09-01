/**
 * Full route for one bus service.
 *
 * Route: /service/196
 *
 * Presented as a vertical timeline: origin at the top, terminus at the
 * bottom, in travel order. Tapping any stop jumps to its arrival board,
 * which is how most people actually use a route listing.
 */

import { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useBusRoutes } from '../../src/hooks/useBusRoutes';
import { useBusData } from '../../src/context/BusDataContext';
import { useTheme } from '../../src/theme/useTheme';
import { space, radius, type, monoFont } from '../../src/theme/tokens';
import {
  getDirections,
  getRouteStops,
  getRouteDistance,
  firstLastBus,
  getDayType,
} from '../../src/utils/route';
import type { BusRoute, BusStop } from '../../src/types/lta';

export default function ServiceScreen() {
  const { no } = useLocalSearchParams<{ no: string }>();
  const router = useRouter();
  const { palette } = useTheme();

  const { stops } = useBusData();
  const { status, routes, progress, error, retry } = useBusRoutes();

  const [direction, setDirection] = useState(1);

  /** Stop code to stop record, so route rows can show real names. */
  const stopsByCode = useMemo(() => {
    const map = new Map<string, BusStop>();
    for (const stop of stops) map.set(stop.BusStopCode, stop);
    return map;
  }, [stops]);

  const directions = useMemo(
    () => (no ? getDirections(routes, no) : []),
    [routes, no]
  );

  const routeStops = useMemo(
    () => (no ? getRouteStops(routes, no, direction) : []),
    [routes, no, direction]
  );

  const totalDistance = getRouteDistance(routeStops);
  const dayType = getDayType();

  const terminusTimes =
    routeStops.length > 0 ? firstLastBus(routeStops[0], dayType) : null;

  if (status === 'loading') {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: `Bus ${no ?? ''}` }} />
        <ActivityIndicator color={palette.accent} />
        <Text style={[type.heading, { color: palette.text }]}>
          Loading routes
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          Route data is larger than the rest, so it downloads the first time
          you open a route. After this it is instant.
        </Text>
        {progress > 0 ? (
          <Text style={[type.caption, { color: palette.textFaint }]}>
            {progress.toLocaleString()} loaded
          </Text>
        ) : null}
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: `Bus ${no ?? ''}` }} />
        <Text style={[type.heading, { color: palette.text }]}>
          Could not load routes
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          {error}
        </Text>
        <Text
          onPress={retry}
          accessibilityRole="button"
          style={[type.body, { color: palette.accent }]}
        >
          Try again
        </Text>
      </View>
    );
  }

  if (routeStops.length === 0) {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: `Bus ${no ?? ''}` }} />
        <Text style={[type.heading, { color: palette.text }]}>
          Route not found
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          No stops are listed for bus {no}.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: `Bus ${no}` }} />

      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          {routeStops.length} stops · {totalDistance.toFixed(1)} km
          {terminusTimes?.first && terminusTimes?.last
            ? ` · first ${terminusTimes.first}, last ${terminusTimes.last}`
            : ''}
        </Text>

        {directions.length > 1 && (
          <View style={[styles.tabs, { backgroundColor: palette.surfaceAlt }]}>
            {directions.map(option => {
              const isActive = direction === option;
              const stopsForOption = no
                ? getRouteStops(routes, no, option)
                : [];
              const terminusCode =
                stopsForOption[stopsForOption.length - 1]?.BusStopCode;
              const terminus = terminusCode
                ? stopsByCode.get(terminusCode)?.Description
                : undefined;

              return (
                <Pressable
                  key={option}
                  onPress={() => setDirection(option)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.tab,
                    isActive && { backgroundColor: palette.surface },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      type.caption,
                      {
                        color: isActive ? palette.text : palette.textMuted,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {terminus ? `To ${terminus}` : `Direction ${option}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <FlatList
        data={routeStops}
        keyExtractor={item => `${item.Direction}-${item.StopSequence}`}
        renderItem={({ item, index }) => (
          <RouteStopRow
            route={item}
            stop={stopsByCode.get(item.BusStopCode)}
            isFirst={index === 0}
            isLast={index === routeStops.length - 1}
            palette={palette}
            onPress={() => router.push(`/stop/${item.BusStopCode}`)}
          />
        )}
      />
    </View>
  );
}

/**
 * One stop in the route timeline.
 *
 * The connector line and node draw the sequence visually, so the order
 * is readable at a glance rather than only through the numbering.
 */
function RouteStopRow({
  route,
  stop,
  isFirst,
  isLast,
  palette,
  onPress,
}: {
  route: BusRoute;
  stop: BusStop | undefined;
  isFirst: boolean;
  isLast: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  onPress: () => void;
}) {
  const name = stop?.Description ?? route.BusStopCode;
  const road = stop?.RoadName;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Stop ${route.StopSequence}, ${name}${
        road ? `, ${road}` : ''
      }`}
      accessibilityHint="Shows bus arrivals at this stop"
      style={({ pressed }) => [
        styles.stopRow,
        { backgroundColor: pressed ? palette.surfaceAlt : palette.surface },
      ]}
    >
      <View style={styles.timeline}>
        <View
          style={[
            styles.connector,
            {
              backgroundColor: isFirst ? 'transparent' : palette.border,
            },
          ]}
        />
        <View
          style={[
            styles.node,
            {
              backgroundColor:
                isFirst || isLast ? palette.accent : palette.surface,
              borderColor: isFirst || isLast ? palette.accent : palette.border,
            },
          ]}
        />
        <View
          style={[
            styles.connector,
            { backgroundColor: isLast ? 'transparent' : palette.border },
          ]}
        />
      </View>

      <View style={styles.stopDetails}>
        <Text
          style={[type.body, styles.stopName, { color: palette.text }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {road ? (
          <Text
            style={[type.caption, { color: palette.textMuted }]}
            numberOfLines={1}
          >
            {road}
          </Text>
        ) : null}
      </View>

      <View style={styles.stopMeta}>
        <Text style={[styles.code, { color: palette.textFaint }]}>
          {route.BusStopCode}
        </Text>
        <Text style={[type.caption, { color: palette.textFaint }]}>
          {route.Distance.toFixed(1)} km
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    gap: space.sm,
    padding: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    gap: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  centreText: { textAlign: 'center' },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.md,
    paddingRight: space.lg,
    paddingLeft: space.lg,
  },
  timeline: {
    width: 12,
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    width: 2,
  },
  node: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  stopDetails: {
    flex: 1,
    gap: 2,
    paddingVertical: space.md,
  },
  stopName: { fontWeight: '600' },
  stopMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  code: {
    fontFamily: monoFont,
    fontSize: 13,
  },
});
