import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { formatCurrency } from 'utils/HelperFn';
import EmptyState from 'components/EmptyState';
import { COLORS, SPACING, FONT_SIZE } from 'theme/Theme';
import { useFocusRefresh } from 'utils/hooks';
import { getVoids } from 'services/Service';
import Card from 'components/Card';
import ScreenContainer from 'components/ScreenContainer';

const Voids = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [voids, setVoids] = useState<any[]>([]);

  const load = useCallback(async () => {
    setVoids(await getVoids(shopId));
  }, [shopId]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [shopId]);

  const byRequester: Record<string, number> = {};
  voids.forEach(v => {
    byRequester[v.requestedBy] = (byRequester[v.requestedBy] || 0) + 1;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Voided Bills</Text>
      <Text style={styles.subtitle}>
        {voids.length} total — permanent record, nothing here is ever deleted
      </Text>

      {Object.keys(byRequester).length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Void count by staff</Text>
          {Object.entries(byRequester).map(([name, count]) => (
            <View key={name} style={styles.summaryRow}>
              <Text style={styles.summaryName}>{name}</Text>
              <Text style={styles.summaryCount}>{count}</Text>
            </View>
          ))}
        </Card>
      )}

      {voids.length === 0 && <EmptyState text="No bills have been voided." />}

      {voids.map(v => (
        <Card key={v.id}>
          <Text style={styles.itemsText}>
            {v.items
              .map((i: any) => `${i.name} (${i.qty}${i.unit})`)
              .join(', ')}
          </Text>
          <Text style={styles.amount}>{formatCurrency(v.originalAmount)}</Text>
          <Text style={styles.metaText}>
            Requested by {v.requestedBy} · Approved by {v.approvedBy}
          </Text>
          <Text style={styles.reasonText}>Reason: {v.reason}</Text>
          <Text style={styles.dateText}>
            {new Date(v.timestamp).toLocaleString('en-IN')}
          </Text>
        </Card>
      ))}
      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },
  subtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryCard: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger },
  summaryTitle: { fontWeight: '700', color: COLORS.danger, marginBottom: 8 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryName: { color: COLORS.cacaoDark, fontWeight: '500' },
  summaryCount: { color: COLORS.danger, fontWeight: '700' },
  itemsText: {
    fontSize: 13,
    color: COLORS.cacaoDark,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 6,
  },
  metaText: { fontSize: 11.5, color: COLORS.textMuted },
  reasonText: {
    fontSize: 12,
    color: COLORS.cacaoDark,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dateText: { fontSize: 10.5, color: COLORS.textFaint, marginTop: 4 },
});

export default Voids;
