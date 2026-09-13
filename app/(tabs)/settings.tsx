/**
 * Settings.
 *
 * Mostly exists to make invisible behaviour visible: how much data is
 * cached, when it was last refreshed, and how to force an update. It
 * also carries the LTA DataMall attribution, which their terms of use
 * require of any application built on the data.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { useBusData } from '../../src/context/BusDataContext';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useTheme } from '../../src/theme/useTheme';
import { space, radius, type } from '../../src/theme/tokens';
import { getCacheAge, CacheKey } from '../../src/services/storage';

export default function SettingsScreen() {
  const { palette } = useTheme();
  const scheme = useColorScheme();
  const { stops, services, status, progress, refresh } = useBusData();
  const { favourites } = useFavourites();

  const [stopsCachedAt, setStopsCachedAt] = useState<Date | null>(null);
  const [routesCachedAt, setRoutesCachedAt] = useState<Date | null>(null);

  const loadCacheAges = useCallback(async () => {
    const [stopsAge, routesAge] = await Promise.all([
      getCacheAge(CacheKey.BusStops),
      getCacheAge(CacheKey.BusRoutes),
    ]);

    setStopsCachedAt(stopsAge);
    setRoutesCachedAt(routesAge);
  }, []);

  useEffect(() => {
    void loadCacheAges();
  }, [loadCacheAges, status]);

  const isRefreshing = status === 'downloading';

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
    >
      <Section title="Offline data" palette={palette}>
        <Row
          label="Bus stops"
          value={`${stops.length.toLocaleString()} cached`}
          palette={palette}
        />
        <Row
          label="Bus services"
          value={`${services.length.toLocaleString()} cached`}
          palette={palette}
        />
        <Row
          label="Stops last updated"
          value={formatCacheAge(stopsCachedAt)}
          palette={palette}
        />
        <Row
          label="Routes last updated"
          value={formatCacheAge(routesCachedAt)}
          palette={palette}
        />

        <Text style={[type.caption, styles.note, { color: palette.textFaint }]}>
          Stop and route data is downloaded once and stored on this device, so
          search works without a connection. It refreshes automatically after a
          week.
        </Text>

        <Pressable
          onPress={refresh}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityState={{ disabled: isRefreshing }}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: isRefreshing
                ? palette.surfaceAlt
                : pressed
                  ? palette.surfaceAlt
                  : palette.accent,
            },
          ]}
        >
          <Text
            style={[
              type.body,
              styles.buttonText,
              { color: isRefreshing ? palette.textMuted : '#FFFFFF' },
            ]}
          >
            {isRefreshing
              ? `Downloading ${progress.toLocaleString()}`
              : 'Refresh bus data now'}
          </Text>
        </Pressable>
      </Section>

      <Section title="Saved" palette={palette}>
        <Row
          label="Saved buses"
          value={String(favourites.length)}
          palette={palette}
        />
      </Section>

      <Section title="Appearance" palette={palette}>
        <Row
          label="Theme"
          value={scheme === 'dark' ? 'Dark' : 'Light'}
          palette={palette}
        />
        <Text style={[type.caption, styles.note, { color: palette.textFaint }]}>
          The app follows your device theme automatically.
        </Text>
      </Section>

      <Section title="Data source" palette={palette}>
        <Text style={[type.caption, styles.note, { color: palette.textMuted }]}>
          Bus arrival, stop, service and route data is provided by the Land
          Transport Authority of Singapore through LTA DataMall. Arrival times
          are estimates and are not guaranteed.
        </Text>

        <Pressable
          onPress={() => Linking.openURL('https://datamall.lta.gov.sg')}
          accessibilityRole="link"
          hitSlop={8}
        >
          <Text style={[type.caption, styles.link, { color: palette.accent }]}>
            datamall.lta.gov.sg
          </Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

/** Relative description of when data was last saved. */
function formatCacheAge(date: Date | null): string {
  if (!date) return 'Not yet downloaded';

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: ReturnType<typeof useTheme>['palette'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[type.caption, styles.sectionTitle, { color: palette.textMuted }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[type.body, { color: palette.text }]}>{label}</Text>
      <Text style={[type.body, { color: palette.textMuted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.xl,
  },
  section: {
    gap: space.sm,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    fontWeight: '600',
    paddingHorizontal: space.xs,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  note: {
    lineHeight: 17,
  },
  link: {
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radius.sm,
  },
  buttonText: {
    fontWeight: '600',
  },
});
