/**
 * Search across bus stops and services.
 *
 * Runs entirely against the locally cached datasets, so results appear
 * as fast as you can type and work with no network at all. The mode
 * switches automatically when the query looks like a stop code, since
 * typing five digits is unambiguous.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBusData } from '../../src/context/BusDataContext';
import { useDebounce } from '../../src/hooks/useDebounce';
import { StopRow } from '../../src/components/StopRow';
import { useTheme } from '../../src/theme/useTheme';
import { space, radius, type, monoFont } from '../../src/theme/tokens';
import {
  searchStops,
  searchServices,
  looksLikeStopCode,
} from '../../src/utils/search';

type Mode = 'stops' | 'services';

export default function SearchScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { status, stops, services, progress, error, refresh } = useBusData();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('stops');
  const debouncedQuery = useDebounce(query, 200);

  // Five digits can only be a stop code, so switch without being asked.
  useEffect(() => {
    if (looksLikeStopCode(query)) setMode('stops');
  }, [query]);

  const stopResults = useMemo(
    () => (mode === 'stops' ? searchStops(stops, debouncedQuery) : []),
    [mode, stops, debouncedQuery]
  );

  const serviceResults = useMemo(
    () => (mode === 'services' ? searchServices(services, debouncedQuery) : []),
    [mode, services, debouncedQuery]
  );

  const hasQuery = debouncedQuery.trim().length > 0;
  const resultCount =
    mode === 'stops' ? stopResults.length : serviceResults.length;

  if (status === 'downloading' || status === 'loading-cache') {
    return (
      <View style={[styles.centre, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.accent} />
        <Text style={[type.heading, { color: palette.text }]}>
          Setting up
        </Text>
        <Text style={[type.body, styles.centreText, { color: palette.textMuted }]}>
          Downloading the bus stop list. This happens once, then everything
          works offline.
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
        <Text style={[type.heading, { color: palette.text }]}>
          Could not load bus data
        </Text>
        <Text style={[type.body, styles.centreText, { color: palette.textMuted }]}>
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
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            mode === 'stops' ? 'Stop name, road or code' : 'Bus number'
          }
          placeholderTextColor={palette.textFaint}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType={mode === 'services' ? 'default' : 'default'}
          clearButtonMode="while-editing"
          accessibilityLabel={
            mode === 'stops' ? 'Search bus stops' : 'Search bus services'
          }
          style={[
            styles.input,
            type.body,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              color: palette.text,
            },
          ]}
        />

        <View style={[styles.tabs, { backgroundColor: palette.surfaceAlt }]}>
          {(['stops', 'services'] as Mode[]).map(option => {
            const isActive = mode === option;

            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: palette.surface },
                ]}
              >
                <Text
                  style={[
                    type.body,
                    {
                      color: isActive ? palette.text : palette.textMuted,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {option === 'stops' ? 'Stops' : 'Buses'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!hasQuery && (
        <View style={styles.centre}>
          <Text style={[type.body, styles.centreText, { color: palette.textMuted }]}>
            {mode === 'stops'
              ? 'Search by stop name, road, or five digit code.'
              : 'Enter a bus number to see its route.'}
          </Text>
          <Text style={[type.caption, { color: palette.textFaint }]}>
            {stops.length.toLocaleString()} stops available offline
          </Text>
        </View>
      )}

      {hasQuery && resultCount === 0 && (
        <View style={styles.centre}>
          <Text style={[type.body, styles.centreText, { color: palette.textMuted }]}>
            Nothing matches “{debouncedQuery.trim()}”.
          </Text>
        </View>
      )}

      {mode === 'stops' && stopResults.length > 0 && (
        <FlatList
          data={stopResults}
          keyExtractor={item => item.BusStopCode}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <StopRow
              stop={item}
              palette={palette}
              onPress={() => router.push(`/stop/${item.BusStopCode}`)}
            />
          )}
        />
      )}

      {mode === 'services' && serviceResults.length > 0 && (
        <FlatList
          data={serviceResults}
          keyExtractor={item => item.ServiceNo}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/service/${item.ServiceNo}`)}
              accessibilityRole="button"
              accessibilityLabel={`Bus ${item.ServiceNo}, ${item.Category.toLowerCase()}`}
              style={({ pressed }) => [
                styles.serviceRow,
                {
                  backgroundColor: pressed
                    ? palette.surfaceAlt
                    : palette.surface,
                  borderBottomColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.serviceNo, { color: palette.text }]}>
                {item.ServiceNo}
              </Text>
              <Text style={[type.caption, { color: palette.textMuted }]}>
                {item.Category}
              </Text>
            </Pressable>
          )}
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
    gap: space.sm,
    padding: space.lg,
  },
  input: {
    height: 44,
    paddingHorizontal: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
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
    borderRadius: radius.sm,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceNo: {
    fontFamily: monoFont,
    fontSize: 20,
    fontWeight: '700',
  },
});
