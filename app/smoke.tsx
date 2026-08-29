import { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { getArrivals } from '../src/services/lta';

export default function Smoke() {
  const [out, setOut] = useState('Loading...');

  useEffect(() => {
    getArrivals('83139')
      .then(d => setOut(JSON.stringify(d, null, 2)))
      .catch(e => setOut('ERROR: ' + e.message));
  }, []);

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.mono}>{out}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  mono: { fontFamily: 'monospace', fontSize: 11 },
});