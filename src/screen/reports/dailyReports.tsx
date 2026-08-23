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
} from '@react-native-firebase/firestore';

const DailyReports = ({ route }: any) => {
  const { shopId } = route.params;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const db = getFirestore();

    const txSnap = await getDocs(
      collection(db, 'shops', shopId, 'transactions'),
    );
    const allTx = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const expensesSnap = await getDocs(
      collection(db, 'shops', shopId, 'expenses'),
    );

    const sales = allTx.filter((t: any) => t.type === 'sale');
    const returns = allTx.filter((t: any) => t.type === 'return');
    const byDate: Record<
      string,
      {
        cashSale: number;
        gpaySale: number;
        expenseByDesc: Record<string, number>;
      }
    > = {};

    const ensure = (date: string) => {
      if (!byDate[date])
        byDate[date] = { cashSale: 0, gpaySale: 0, expenseByDesc: {} };
      return byDate[date];
    };

    // Sales add to their date's total
    sales.forEach((t: any) => {
      const bucket = ensure(t.date);
      if (t.paymentMethod === 'gpay') bucket.gpaySale += t.finalAmount;
      else bucket.cashSale += t.finalAmount;
    });

    // Returns subtract from the ORIGINAL sale's date and payment method
    // (a return today of something sold yesterday still adjusts yesterday's figures,
    // since that's when the revenue was actually recorded)
    returns.forEach((r: any) => {
      const original = sales.find((s: any) => s.id === r.originalTransactionId);
      if (!original) return; // original sale not found, skip safely
      const bucket = ensure(original.date);
      if (original.paymentMethod === 'gpay') bucket.gpaySale -= r.refundAmount;
      else bucket.cashSale -= r.refundAmount;
    });

    expensesSnap.docs.forEach(d => {
      const e = d.data() as any;
      const bucket = ensure(e.date);
      const key = e.description.trim().toLowerCase();
      bucket.expenseByDesc[key] = (bucket.expenseByDesc[key] || 0) + e.amount;
    });

    const result = Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const b = byDate[date];
        const expenseTotal = Object.values(b.expenseByDesc).reduce(
          (s, v) => s + v,
          0,
        );
        return {
          date,
          sale: b.cashSale + b.gpaySale,
          gpay: b.gpaySale,
          expenseTotal,
          expenseByDesc: b.expenseByDesc,
          hand: b.cashSale - expenseTotal,
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

          <Text style={styles.expenseHeading}>Expense</Text>
          {Object.keys(row.expenseByDesc).length === 0 && (
            <Text style={styles.subRowText}>— none —</Text>
          )}
          {Object.entries(row.expenseByDesc).map(([desc, amt]) => (
            <View key={desc} style={styles.subRow}>
              <Text style={styles.subRowText}>{desc}</Text>
              <Text style={styles.subRowValue}>
                ₹{(amt as number).toFixed(2)}
              </Text>
            </View>
          ))}

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
  expenseHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A4A2B',
    marginTop: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingVertical: 2,
  },
  subRowText: { fontSize: 12.5, color: '#7A4A2B' },
  subRowValue: { fontSize: 12.5, fontWeight: '600', color: '#9C3654' },
  divider: { height: 1, backgroundColor: '#E2CFAF', marginVertical: 6 },
});

export default DailyReports;
