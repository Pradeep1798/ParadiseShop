import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from '@react-native-firebase/firestore';

const DailyReports = ({ route }: any) => {
  const { shopId } = route.params;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const db = getFirestore();

    const salesSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'transactions'),
        orderBy('timestamp', 'desc'),
      ),
    );
    const expensesSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'expenses'),
        orderBy('timestamp', 'desc'),
      ),
    );

    const byDate: Record<
      string,
      {
        cashSale: number;
        gpaySale: number;
        cashExpense: number;
        gpayExpense: number;
      }
    > = {};

    const ensure = (date: string) => {
      if (!byDate[date])
        byDate[date] = {
          cashSale: 0,
          gpaySale: 0,
          cashExpense: 0,
          gpayExpense: 0,
        };
      return byDate[date];
    };

    salesSnap.docs.forEach(d => {
      const t = d.data();
      if (t.type !== 'sale') return;
      const bucket = ensure(t.date);
      if (t.paymentMethod === 'gpay') bucket.gpaySale += t.finalAmount;
      else bucket.cashSale += t.finalAmount;
    });

    expensesSnap.docs.forEach(d => {
      const e = d.data();
      const bucket = ensure(e.date);
      if (e.paymentMethod === 'gpay') bucket.gpayExpense += e.amount;
      else bucket.cashExpense += e.amount;
    });

    const result = Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const b = byDate[date];
        return {
          date,
          sale: b.cashSale + b.gpaySale, // ← total across both payment methods
          gpay: b.gpaySale,
          expense: b.cashExpense,
          hand: b.cashSale - b.cashExpense,
        };
      });
    setRows(result);
  }, [shopId]);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Reports</Text>

      {rows.length === 0 && (
        <Text style={styles.empty}>No sales or expenses recorded yet.</Text>
      )}

      {rows.map(row => (
        <View key={row.date} style={styles.card}>
          <Text style={styles.date}>{row.date}</Text>
          <Row label="Sale" value={row.sale} color="#5C7D57" />
          <Row label="GPay" value={row.gpay} color="#5C7D57" />
          <Row label="Expense" value={row.expense} color="#9C3654" />
          <View style={styles.divider} />
          <Row label="Hand" value={row.hand} color="#5C3620" bold />
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const Row = ({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.rowValue, { color }, bold && styles.bold]}>
      ₹{value.toFixed(2)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B160C',
    marginBottom: 20,
  },
  empty: { color: '#7A4A2B', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  date: { fontSize: 15, fontWeight: '700', color: '#2B160C', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: { fontSize: 13, color: '#7A4A2B' },
  rowValue: { fontSize: 13, fontWeight: '600' },
  bold: { fontWeight: '800', fontSize: 14.5 },
  divider: { height: 1, backgroundColor: '#E2CFAF', marginVertical: 6 },
});

export default DailyReports;
