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
  where,
} from '@react-native-firebase/firestore';
import { formatCurrency } from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';

const DailyReports = ({ route }: any) => {
  const { shopId } = route.params;
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daysBack, setDaysBack] = useState(7);

  const load = useCallback(async () => {
    const db = getFirestore();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const txSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'transactions'),
        where('date', '>=', cutoffStr),
      ),
    );
    const allTx = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const expensesSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'expenses'),
        where('date', '>=', cutoffStr),
      ),
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
      if (t.cashPortion !== undefined) {
        // new-style record (supports split payments)
        bucket.cashSale += t.cashPortion;
        bucket.gpaySale += t.gpayPortion;
      } else {
        // old record, created before split payments existed
        if (t.paymentMethod === 'gpay') bucket.gpaySale += t.finalAmount;
        else bucket.cashSale += t.finalAmount;
      }
    });

    // Returns subtract from the ORIGINAL sale's date and payment method
    // (a return today of something sold yesterday still adjusts yesterday's figures,
    // since that's when the revenue was actually recorded)
    returns.forEach((r: any) => {
      const original = sales.find((s: any) => s.id === r.originalTransactionId);
      if (!original) return;
      const bucket = ensure(original.date);
      const method = r.refundMethod || original.paymentMethod; // fallback for old returns made before this change
      if (method === 'gpay') bucket.gpaySale -= r.refundAmount;
      else bucket.cashSale -= r.refundAmount;
    });

    expensesSnap.docs.forEach(d => {
      const e = d.data() as any;
      const bucket = ensure(e.date);
      const key = e.description.trim().toLowerCase();
      bucket.expenseByDesc[key] = (bucket.expenseByDesc[key] || 0) + e.amount;
    });
    const closingSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'dailyClosings'),
        where('date', '>=', cutoffStr),
      ),
    );
    const closingsByDate: Record<string, any> = {};
    closingSnap.docs.forEach(d => {
      closingsByDate[d.id] = d.data();
    });

    const result = Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const b = byDate[date];
        const expenseTotal = Object.values(b.expenseByDesc).reduce(
          (s, v) => s + v,
          0,
        );
        const closing = closingsByDate[date];
        return {
          date,
          sale: b.cashSale + b.gpaySale,
          gpay: b.gpaySale,
          expenseTotal,
          expenseByDesc: b.expenseByDesc,
          hand: closing ? closing.finalHand : b.cashSale - expenseTotal,
          excessOrShortage: closing ? closing.excessOrShortage : null,
          closingNote: closing ? closing.note : null,
        };
      });

    setRows(result);
  }, [shopId, daysBack]);

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

  const Row = ({
    label,
    value,
    tone,
    bold,
  }: {
    label: string;
    value: number;
    tone: 'income' | 'expense' | 'neutral' | 'warning';
    bold?: boolean;
  }) => {
    const toneStyles = {
      income: {
        background: '#EEF5EC',
        color: '#4F704B',
        icon: '↗',
      },
      expense: {
        background: '#FBECEF',
        color: '#9C3654',
        icon: '↘',
      },
      neutral: {
        background: '#F5EEE8',
        color: '#6B452D',
        icon: '₹',
      },
      warning: {
        background: '#FFF7DF',
        color: '#A77A18',
        icon: '!',
      },
    };

    const current = toneStyles[tone];

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: current.background,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor: '#FFFFFF',
              },
            ]}
          >
            <Text style={[styles.rowIconText, { color: current.color }]}>
              {current.icon}
            </Text>
          </View>

          <Text
            style={[
              styles.rowLabel,
              { color: current.color },
              bold && styles.bold,
            ]}
          >
            {label}
          </Text>
        </View>

        <Text
          style={[
            styles.rowValue,
            { color: current.color },
            bold && styles.bold,
          ]}
        >
          {formatCurrency(value)}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {rows.length === 0 && (
        <Text style={styles.empty}>No sales or expenses recorded yet.</Text>
      )}

      {rows.map(row => (
        <View key={row.date} style={styles.card}>
          <Text style={styles.date}>{row.date}</Text>
          <Row label="Sale" value={row.sale} tone="income" />
          <Row label="GPay" value={row.gpay} tone="income" />
          <Text style={styles.expenseHeading}>▪ EXPENSES</Text>

          {Object.entries(row.expenseByDesc).map(([desc, amt]) => (
            <View key={desc} style={styles.expenseRow}>
              <View style={styles.expenseDot} />

              <Text style={styles.subRowText}>{desc}</Text>

              <Text style={styles.subRowValue}>
                {formatCurrency(amt as number)}
              </Text>
            </View>
          ))}

          {row.excessOrShortage !== null && row.excessOrShortage !== 0 && (
            <Row
              label={row.excessOrShortage > 0 ? 'Excess' : 'Shortage'}
              value={Math.abs(row.excessOrShortage)}
              tone={row.excessOrShortage > 0 ? 'income' : 'expense'}
            />
          )}

          {!!row.closingNote && (
            <Text style={styles.closingNoteText}>📝 {row.closingNote}</Text>
          )}

          <Row label="Hand" value={row.hand} tone="neutral" bold />
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    // paddingTop: 48,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8C7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#5C3620',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  date: { fontSize: 15, fontWeight: '700', color: '#2B160C', marginBottom: 10 },
  closingNoteText: {
    fontSize: 12,
    color: '#7A4A2B',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 9,
    marginBottom: 6,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,

    justifyContent: 'center',
    alignItems: 'center',
  },

  rowIconText: {
    fontSize: 14,
    fontWeight: '800',
  },

  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },

  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  bold: {
    fontWeight: '800',
    fontSize: 14.5,
  },
  expenseSection: {
    marginTop: 4,
    marginBottom: 6,
    padding: 10,

    backgroundColor: '#FFF9F4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0DFCC',
  },
  expenseHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A4A2B',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 7,
    paddingHorizontal: 2,
  },

  sectionHeader: {
    marginBottom: 7,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A4A2B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C98B68',
    marginRight: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingVertical: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  subRowText: {
    flex: 1,
    fontSize: 12.5,
    color: '#6F4A35',
  },

  subRowValue: {
    minWidth: 75,
    textAlign: 'right',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9C3654',
  },
  divider: { height: 1, backgroundColor: '#E2CFAF', marginVertical: 6 },
});

export default DailyReports;
