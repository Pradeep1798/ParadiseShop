import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { getFirestore, collection, getDocs, query, orderBy } from '@react-native-firebase/firestore';
import { formatCurrency } from 'utils/HelperFn';

const Voids = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [voids, setVoids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(query(collection(db, 'shops', shopId, 'voids'), orderBy('timestamp', 'desc')));
    setVoids(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [shopId]);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Quick pattern-spotting: void count per person
  const byRequester: Record<string, number> = {};
  voids.forEach((v) => { byRequester[v.requestedBy] = (byRequester[v.requestedBy] || 0) + 1; });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Voided Bills</Text>
      <Text style={styles.subtitle}>{voids.length} total — permanent record, nothing here is ever deleted</Text>

      {Object.keys(byRequester).length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Void count by staff</Text>
          {Object.entries(byRequester).map(([name, count]) => (
            <View key={name} style={styles.summaryRow}>
              <Text style={styles.summaryName}>{name}</Text>
              <Text style={styles.summaryCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      {voids.length === 0 && <Text style={styles.empty}>No bills have been voided.</Text>}

      {voids.map((v) => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.itemsText}>{v.items.map((i: any) => `${i.name} (${i.qty}${i.unit})`).join(', ')}</Text>
          <Text style={styles.amount}>{formatCurrency(v.originalAmount)}</Text>
          <Text style={styles.metaText}>Requested by {v.requestedBy} · Approved by {v.approvedBy}</Text>
          <Text style={styles.reasonText}>Reason: {v.reason}</Text>
          <Text style={styles.dateText}>{new Date(v.timestamp).toLocaleString('en-IN')}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF4EC', padding: 24, paddingTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBF4EC' },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 12.5, color: '#7A4A2B', marginTop: 4, marginBottom: 16 },
  summaryCard: { backgroundColor: '#F3DEE2', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryTitle: { fontWeight: '700', color: '#9C3654', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryName: { color: '#2B160C', fontWeight: '500' },
  summaryCount: { color: '#9C3654', fontWeight: '700' },
  empty: { color: '#7A4A2B', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 12, padding: 14, marginBottom: 12 },
  itemsText: { fontSize: 13, color: '#2B160C', fontWeight: '500', marginBottom: 4 },
  amount: { fontSize: 15, fontWeight: '700', color: '#9C3654', marginBottom: 6 },
  metaText: { fontSize: 11.5, color: '#7A4A2B' },
  reasonText: { fontSize: 12, color: '#2B160C', fontStyle: 'italic', marginTop: 4 },
  dateText: { fontSize: 10.5, color: '#9C8768', marginTop: 4 },
});

export default Voids;