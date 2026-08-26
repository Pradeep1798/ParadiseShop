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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStockUnitLabel } from 'utils/HelperFn';

const HISTORY_KEY = 'weekly_report_history';

const Notifications = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    const db = getFirestore();
    const today = new Date().toISOString().slice(0, 10);

    // Low stock check
    const catSnap = await getDocs(
      collection(db, 'shops', shopId, 'categories'),
    );
    const low: any[] = [];
    catSnap.docs.forEach(d => {
      const cat = d.data() as any;
      (cat.subVarieties || []).forEach((sv: any) => {
        if (sv.stock <= sv.lowStockThreshold) {
          low.push({
            name: sv.name,
            category: cat.name,
            stock: sv.stock,
            unit: sv.unit,
            threshold: sv.lowStockThreshold,
          });
        }
      });
    });
    setLowStock(low);

    // Today's summary
    const txSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'transactions'),
        where('date', '==', today),
      ),
    );
    const expSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'expenses'),
        where('date', '==', today),
      ),
    );
    let cash = 0,
      gpay = 0;
    txSnap.docs.forEach(d => {
      const t = d.data() as any;
      if (t.type === 'sale') {
        if (t.paymentMethod === 'gpay') gpay += t.finalAmount;
        else cash += t.finalAmount;
      }
    });
    let expenseTotal = 0;
    expSnap.docs.forEach(d => {
      expenseTotal += (d.data() as any).amount;
    });
    setTodaySummary({
      sale: cash + gpay,
      cash,
      gpay,
      expenseTotal,
      hand: cash - expenseTotal,
    });

    // Recent weekly reports
    const raw = await AsyncStorage.getItem(`${HISTORY_KEY}_${shopId}`);
    const reports = raw ? JSON.parse(raw) : [];
    setRecentReports(reports.slice(0, 3));
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
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚠️ Low Stock ({lowStock.length})</Text>
        {lowStock.length === 0 && (
          <Text style={styles.empty}>Everything is comfortably stocked.</Text>
        )}
        {lowStock.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowText}>
              {item.category} — {item.name}
            </Text>
            <Text style={styles.rowValueLow}>
              {item.stock.toFixed(2)}
              {getStockUnitLabel(item.unit)}
            </Text>
          </View>
        ))}
      </View>

      {todaySummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Today So Far</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>Sale</Text>
            <Text style={styles.rowValue}>₹{todaySummary.sale.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Cash</Text>
            <Text style={styles.rowValue}>₹{todaySummary.cash.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>GPay</Text>
            <Text style={styles.rowValue}>₹{todaySummary.gpay.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Expenses</Text>
            <Text style={styles.rowValue}>
              ₹{todaySummary.expenseTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowText, styles.bold]}>Hand</Text>
            <Text style={[styles.rowValue, styles.bold]}>
              ₹{todaySummary.hand.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📄 Recent Weekly Reports</Text>
        {recentReports.length === 0 && (
          <Text style={styles.empty}>No reports generated yet.</Text>
        )}
        {recentReports.map((r: any) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.rowText}>{r.label}</Text>
            <Text style={styles.rowValue}>
              {new Date(r.generatedAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C3620',
    marginBottom: 10,
  },
  empty: { color: '#7A4A2B', fontSize: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  rowText: { fontSize: 13, color: '#2B160C' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#5C3620' },
  rowValueLow: { fontSize: 13, fontWeight: '600', color: '#9C3654' },
  bold: { fontWeight: '800' },
});

export default Notifications;
