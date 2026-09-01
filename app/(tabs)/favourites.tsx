/**
 * Saved stops and services.
 *
 * Each saved stop shows its live arrivals inline, so the common case,
 * checking the two or three buses you actually take, needs no taps at
 * all.
 */

import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useBusData } from '../../src/context/BusDataContext';
import { useArrivals } from '../../src/hooks/useArrivals';
import { ArrivalRow } from '../../src/components/ArrivalRow';
import { useTheme } from '../../src/theme/useTheme';
import { space, type, type Palette } from '../../src/theme/tokens';
import { groupByStop } from '../../src/utils/favourites';

export default function FavouritesScreen() {
  const { palette } = useTheme();
  const { favourites, loaded } = useFavourites();

  const groups = groupByStop(favourites);

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  if (groups.length === 0) {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <Text style={[type.heading, { color: palette.text }]}>
          Nothing saved yet
        </Text>
        <Text
          style={[type.body, styles.centreText, { color: palette.textMuted }]}
        >
          Tap the bookmark on any bus to save it. Saved buses appear here
          together, so your usual routes are one tap away.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <FlatList
        data={groups}
        keyExtractor={item => item.stopCode}
        renderItem={({ item }) => (
          <SavedStop
            stopCode={item.stopCode}
            services={item.services}
            palette={palette}
          />
        )}
      />
    </View>
  );
}

/**
 * One saved stop with its arrivals.
 *
 * Each card polls independently. Acceptable at the handful of stops
 * people actually save; if that assumption ever breaks, the fetching
 * would need lifting into a single batched request.
 */
function SavedStop({
  stopCode,
  services,
  palette,
}: {
  stopCode: string;
  services: string[];
  palette: Palette;
}) {
  const router = useRouter();
  const { stops } = useBusData();
  const { services: arrivals, now, isEmpty } = useArrivals(stopCode);

  const stop = stops.find(candidate => candidate.BusStopCode === stopCode);

  // An empty services list means the whole stop was saved, so show
  // everything; otherwise show only the saved services.
  const visible =
    services.length === 0
      ? arrivals
      : arrivals.filter(arrival => services.includes(arrival.ServiceNo));

  return (
    <View style={[styles.card, { borderBottomColor: palette.border }]}>
      <Pressable
        onPress={() => router.push(`/stop/${stopCode}`)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${stop?.Description ?? stopCode}`}
        style={styles.cardHeader}
      >
        <Text style={[type.heading, { color: palette.text }]} numberOfLines={1}>
          {stop?.Description ?? stopCode}
        </Text>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          {stop?.RoadName ?? ''}
        </Text>
      </Pressable>

      {visible.length === 0 ? (
        <Text
          style={[type.caption, styles.quiet, { color: palette.textFaint }]}
        >
          {isEmpty ? 'No buses running' : 'Loading'}
        </Text>
      ) : (
        visible.map(service => (
          <ArrivalRow
            key={service.ServiceNo}
            service={service}
            now={now}
            palette={palette}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    borderBottomWidth: space.sm,
  },
  cardHeader: {
    gap: 2,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  centreText: { textAlign: 'center' },
  quiet: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
});
