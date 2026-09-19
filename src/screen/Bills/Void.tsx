import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getVoids } from 'services/Service';
import { useFocusRefresh } from 'utils/hooks';
import { formatCurrency } from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';
import SectionLabel from 'components/SectionLabel';
import { COLORS } from 'theme/Theme';
import { VoidRecord } from 'types/Domain';

const Voids = ({ route }: { route: { params?: { shopId?: string } } }) => {
  const { shopId } = route.params || {};
  const [voids, setVoids] = useState<VoidRecord[]>([]);

  const load = useCallback(async () => {
    setVoids(await getVoids(shopId));
  }, [shopId]);

  const { refreshing, onRefresh } = useFocusRefresh(load, [load]);

  const byRequester: Record<string, number> = {};
  voids.forEach(v => {
    byRequester[v.requestedBy] = (byRequester[v.requestedBy] || 0) + 1;
  });

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Voided Bills</Text>
      <Text style={styles.subtitle}>
        {voids.length} total — permanent record, nothing here is ever deleted
      </Text>

      {Object.keys(byRequester).length > 0 && (
        <View style={styles.summaryCard}>
          <SectionLabel>Void count by staff</SectionLabel>
          {Object.entries(byRequester).map(([name, count]) => (
            <View key={name} style={styles.summaryRow}>
              <Text style={styles.summaryName}>{name}</Text>
              <Text style={styles.summaryCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      {voids.length === 0 && (
        <Text style={styles.empty}>No bills have been voided.</Text>
      )}

      {voids.map(v => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.itemsText}>
            {v.items.map(i => `${i.name} (${i.qty}${i.unit})`).join(', ')}
          </Text>
          <Text style={styles.amount}>{formatCurrency(v.originalAmount)}</Text>
          <Text style={styles.metaText}>
            Requested by {v.requestedBy} · Approved by {v.approvedBy}
          </Text>
          <Text style={styles.reasonText}>Reason: {v.reason}</Text>
          <Text style={styles.dateText}>
            {new Date(v.timestamp).toLocaleString('en-IN')}
          </Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: COLORS.cacaoDark },
  subtitle: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
  summaryCard: { backgroundColor: '#F3DEE2', borderWidth: 1, borderColor: COLORS.danger, borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryName: { color: COLORS.cacaoDark, fontWeight: '500' },
  summaryCount: { color: COLORS.danger, fontWeight: '700' },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 12 },
  itemsText: { fontSize: 13, color: COLORS.cacaoDark, fontWeight: '500', marginBottom: 4 },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.danger, marginBottom: 6 },
  metaText: { fontSize: 11.5, color: COLORS.textMuted },
  reasonText: { fontSize: 12, color: COLORS.cacaoDark, fontStyle: 'italic', marginTop: 4 },
  dateText: { fontSize: 10.5, color: COLORS.textFaint, marginTop: 4 },
});

export default Voids;