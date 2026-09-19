import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getStockUnitLabel } from 'utils/HelperFn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from 'components/Card';
import StatRow from 'components/StatRow';
import EmptyState from 'components/EmptyState';
import { COLORS, SPACING, FONT_SIZE } from 'theme/Theme';
import {
  getCategories,
  getExpensesByDateRange,
  getTransactionsForDate,
} from 'services/Service';
import {
  applyReturnsToTotals,
  computeCashGpayTotals,
  excludeVoided,
} from 'utils/SalesCalculation';
import { useFocusRefresh } from 'utils/hooks';
import ScreenContainer from 'components/ScreenContainer';
import { Category, SubVariety } from 'types/Domain';

interface LowStockItem {
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
}

interface TodaySummary {
  sale: number;
  cash: number;
  gpay: number;
  expenseTotal: number;
  hand: number;
}

interface ReportHistoryEntry {
  id: number;
  label: string;
  generatedAt: number;
  filePath: string;
}

const HISTORY_KEY = 'weekly_report_history';

const Notifications = ({
  route,
}: {
  route: { params?: { shopId?: string } };
}) => {
  const { shopId } = route.params || {};
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [recentReports, setRecentReports] = useState<ReportHistoryEntry[]>([]);

  const load = useCallback(async () => {
    if (!shopId) return;
    const today = new Date().toISOString().slice(0, 10);

    const [categories, allTx, expenses, historyRaw] = await Promise.all([
      getCategories(shopId),
      getTransactionsForDate(shopId, today),
      getExpensesByDateRange(shopId, today, today),
      AsyncStorage.getItem(`${HISTORY_KEY}_${shopId}`),
    ]);

    // Low stock check
    const low: LowStockItem[] = [];
    categories.forEach(cat => {
      cat.subVarieties.forEach((sv: SubVariety) => {
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

    // Today's summary — same shared math as Bills/Reports/Close Bill
    const sales = excludeVoided(allTx.filter(t => t.type === 'sale'));
    const returns = allTx.filter(t => t.type === 'return');
    const rawTotals = computeCashGpayTotals(sales);
    const { cash, gpay } = applyReturnsToTotals(rawTotals, sales, returns);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    setTodaySummary({
      sale: cash + gpay,
      cash,
      gpay,
      expenseTotal,
      hand: cash - expenseTotal,
    });

    // Recent weekly/monthly reports
    const reports = historyRaw ? JSON.parse(historyRaw) : [];
    setRecentReports(reports.slice(0, 3));
  }, [shopId]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Notifications</Text>

      <Card>
        <Text style={styles.cardTitle}>⚠️ Low Stock ({lowStock.length})</Text>
        {lowStock.length === 0 && (
          <EmptyState text="Everything is comfortably stocked." />
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
      </Card>

      {todaySummary && (
        <Card>
          <Text style={styles.cardTitle}>📋 Today So Far</Text>
          <StatRow label="Sale" value={todaySummary.sale} tone="income" />
          <StatRow label="Cash" value={todaySummary.cash} tone="income" />
          <StatRow label="GPay" value={todaySummary.gpay} tone="income" />
          <StatRow
            label="Expenses"
            value={todaySummary.expenseTotal}
            tone="expense"
          />
          <StatRow label="Hand" value={todaySummary.hand} tone="neutral" bold />
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>📄 Recent Reports</Text>
        {recentReports.length === 0 && (
          <EmptyState text="No reports generated yet." />
        )}
        {recentReports.map(r => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.rowText}>{r.label}</Text>
            <Text style={styles.rowValue}>
              {new Date(r.generatedAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </Card>

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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cacao,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  rowText: { fontSize: 13, color: COLORS.cacaoDark },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.cacao },
  rowValueLow: { fontSize: 13, fontWeight: '600', color: COLORS.danger },
});

export default Notifications;