import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatRow from 'components/StatRow';
import EmptyState from 'components/EmptyState';
import { COLORS, SPACING, FONT_SIZE } from 'theme/Theme';
import { formatCurrency as formatMoney } from 'utils/HelperFn';
import {
  getDailyClosingsByRange,
  getExpensesByDateRange,
  getTransactionsByDateRange,
} from 'services/Service';
import {
  applyReturnsToTotals,
  computeCashGpayTotals,
  computeExpenseBreakdown,
  excludeVoided,
} from 'utils/SalesCalculation';
import { useFocusRefresh } from 'utils/hooks';
import Card from 'components/Card';
import ScreenContainer from 'components/ScreenContainer';
import ChocolateLoader from 'components/ChocolateLoader';

const DailyReports = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [rows, setRows] = useState<any[]>([]);

  const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const load = useCallback(async () => {
    const cutoff = getMonthStart();
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const [allTx, allExpenses, closingsByDate] = await Promise.all([
      getTransactionsByDateRange(shopId, cutoffStr),
      getExpensesByDateRange(shopId, cutoffStr),
      getDailyClosingsByRange(shopId, cutoffStr),
    ]);

    const sales = excludeVoided(allTx.filter(t => t.type === 'sale'));
    const returns = allTx.filter(t => t.type === 'return');

    // Group everything by date first
    const dates = new Set<string>([
      ...sales.map(t => t.date),
      ...allExpenses.map(e => e.date),
    ]);

    const result = Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .map(date => {
        const datesSales = sales.filter(t => t.date === date);
        const datesExpenses = allExpenses.filter(e => e.date === date);

        const rawTotals = computeCashGpayTotals(datesSales);
        const { cash, gpay } = applyReturnsToTotals(
          rawTotals,
          datesSales,
          returns,
        );
        const { byDesc, total: expenseTotal } =
          computeExpenseBreakdown(datesExpenses);

        const closing = closingsByDate[date];
        return {
          date,
          sale: cash + gpay,
          gpay,
          expenseTotal,
          expenseByDesc: byDesc,
          hand: closing ? closing.finalHand : cash - expenseTotal,
          excessOrShortage: closing ? closing.excessOrShortage : null,
          closingNote: closing ? closing.note : null,
        };
      });

    setRows(result);
  }, [shopId]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ChocolateLoader size="medium" text="Loading reports..." />
      </View>
    );
  }

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <Text style={styles.title}>Reports</Text>

      {rows.length === 0 && (
        <EmptyState text="No sales or expenses recorded yet." />
      )}

      {rows.map(row => (
        <Card key={row.date}>
          <Text style={styles.date}>{row.date}</Text>
          <StatRow label="Sale" value={row.sale} tone="income" />
          <StatRow label="GPay" value={row.gpay} tone="income" />

          <Text style={styles.expenseHeading}>Expense</Text>
          {Object.keys(row.expenseByDesc).length === 0 && (
            <Text style={styles.subRowText}>— none —</Text>
          )}
          {Object.entries(row.expenseByDesc).map(([desc, amt]) => (
            <View key={desc} style={styles.subRow}>
              <Text style={styles.subRowText}>{desc}</Text>
              <Text style={styles.subRowValue}>
                {formatMoney(amt as number)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {row.excessOrShortage !== null && row.excessOrShortage !== 0 && (
            <StatRow
              label={row.excessOrShortage > 0 ? 'Excess' : 'Shortage'}
              value={Math.abs(row.excessOrShortage)}
              tone={row.excessOrShortage > 0 ? 'income' : 'expense'}
            />
          )}
          {!!row.closingNote && (
            <Text style={styles.closingNoteText}>📝 {row.closingNote}</Text>
          )}

          <StatRow label="Hand" value={row.hand} tone="neutral" bold />
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
    marginBottom: 20,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.cacaoDark,
    marginBottom: 10,
  },
  expenseHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingVertical: 2,
    marginBottom: 2,
  },
  subRowText: { fontSize: 12.5, color: COLORS.textMuted },
  subRowValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
  closingNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
});

export default DailyReports;