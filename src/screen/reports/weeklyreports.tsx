import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  computeCashGpayTotals,
  applyReturnsToTotals,
  computeDiscountTotal,
  computeExpenseBreakdown,
  computeStockMovementByProduct,
  rankProductsByQuantity,
  excludeVoided,
} from 'utils/SalesCalculation';
import { getStockUnitLabel, computeStockDelta } from 'utils/HelperFn';
import { formatCurrency } from 'utils/HelperFn';
import AppButton from 'components/AppButton';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';
import { COLORS, SPACING, FONT_SIZE } from 'theme/Theme';
import {
  getExpensesByDateRange,
  getTransactionsByDateRange,
} from 'services/Service';

const HISTORY_KEY = 'weekly_report_history';

const WeeklyReport = ({ route }: any) => {
  const { shopId, shopName } = route.params || {};
  const [reportMode, setReportMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = useCallback(async () => {
    const raw = await AsyncStorage.getItem(`${HISTORY_KEY}_${shopId}`);
    setHistory(raw ? JSON.parse(raw) : []);
  }, [shopId]);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const changeMonth = (offset: number) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + offset);
    if (d > new Date()) return;
    setSelectedMonth(d);
  };
  const getMonthLabel = (d: Date) =>
    d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const isCurrentMonth =
    selectedMonth.getFullYear() === new Date().getFullYear() &&
    selectedMonth.getMonth() === new Date().getMonth();

  const generateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      let startStr: string, endStr: string, periodLabel: string;

      if (reportMode === 'weekly') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startStr = startDate.toISOString().slice(0, 10);
        endStr = endDate.toISOString().slice(0, 10);
        periodLabel = `${startStr} to ${endStr}`;
      } else {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const effectiveEnd = isCurrentMonth ? new Date() : monthEnd;
        startStr = monthStart.toISOString().slice(0, 10);
        endStr = effectiveEnd.toISOString().slice(0, 10);
        periodLabel = getMonthLabel(selectedMonth);
      }

      const [allTx, expenses] = await Promise.all([
        getTransactionsByDateRange(shopId, startStr, endStr),
        getExpensesByDateRange(shopId, startStr, endStr),
      ]);

      const sales = excludeVoided(allTx.filter(t => t.type === 'sale'));
      const returns = allTx.filter(t => t.type === 'return');
      const stockIns = allTx.filter(t => t.type === 'stock_in');

      const rawTotals = computeCashGpayTotals(sales);
      const { cash: cashTotal, gpay: gpayTotal } = applyReturnsToTotals(
        rawTotals,
        sales,
        returns,
      );
      const discountTotal = computeDiscountTotal(sales);
      const { byDesc: expenseByDesc, total: expenseTotal } =
        computeExpenseBreakdown(expenses);
      const stockInByProduct = computeStockMovementByProduct(stockIns);

      const stockSoldByProduct = computeStockMovementByProduct(sales);
      returns.forEach(r => {
        const original = sales.find(s => s.id === r.originalTransactionId);
        if (!original) return;
        const key = original.subVarietyName;
        if (stockSoldByProduct[key]) stockSoldByProduct[key].qty -= r.quantity;
      });

      const ranked = rankProductsByQuantity(sales);
      const top5 = ranked.slice(0, 5);
      const bottom5 = ranked.slice(-5).reverse();

      const makeChartUrl = (
        labels: string[],
        values: number[],
        colors: string[],
        title: string,
      ) => {
        const config = {
          type: 'pie',
          data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors }],
          },
          options: {
            title: { display: true, text: title },
            plugins: {
              datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 12 },
                formatter: (v: number) => v,
              },
            },
          },
        };
        return `https://quickchart.io/chart?width=500&height=300&c=${encodeURIComponent(
          JSON.stringify(config),
        )}`;
      };

      const pieChartUrl = makeChartUrl(
        top5.map(([n]) => n),
        top5.map(([, q]) => q),
        ['#C17A3D', '#5C7D57', '#9C3654', '#5C3620', '#B8871E'],
        'Top 5 Products (quantity sold)',
      );
      const lowChartUrl = makeChartUrl(
        bottom5.map(([n]) => n),
        bottom5.map(([, q]) => q),
        ['#9C3654', '#C17A3D', '#5C7D57', '#5C3620', '#B8871E'],
        'Lowest 5 Products (quantity sold)',
      );

      const html = `
        <html>
          <body style="font-family: Helvetica; padding: 24px; color: #2B160C;">
            <h1 style="color: #5C3620;">${shopName} — ${
        reportMode === 'weekly' ? 'Weekly' : 'Monthly'
      } Report</h1>
            <p style="color: #7A4A2B;">${periodLabel}</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 8px; font-weight: bold;">Total Sale</td><td style="padding: 8px;">${formatCurrency(
                cashTotal + gpayTotal,
              )}</td></tr>
              <tr style="background: #FBF4EC;"><td style="padding: 8px; font-weight: bold;">Cash</td><td style="padding: 8px;">${formatCurrency(
                cashTotal,
              )}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">GPay</td><td style="padding: 8px;">${formatCurrency(
                gpayTotal,
              )}</td></tr>
              <tr style="background: #FBF4EC;"><td style="padding: 8px; font-weight: bold;">Total Discount Given</td><td style="padding: 8px;">${formatCurrency(
                discountTotal,
              )}</td></tr>
            </table>

            <h2 style="color: #5C3620; margin-top: 30px;">Expenses — Total: ${formatCurrency(
              expenseTotal,
            )}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(expenseByDesc)
                .map(
                  ([desc, amt]) =>
                    `<tr><td style="padding: 6px;">${desc}</td><td style="padding: 6px;">${formatCurrency(
                      amt as number,
                    )}</td></tr>`,
                )
                .join('')}
            </table>

            <h2 style="color: #5C3620; margin-top: 30px;">Stock In</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(stockInByProduct)
                .map(
                  ([name, data]) =>
                    `<tr><td style="padding: 6px;">${name}</td><td style="padding: 6px;">${data.qty.toFixed(
                      2,
                    )}${getStockUnitLabel(data.unit)}</td></tr>`,
                )
                .join('')}
            </table>

            <h2 style="color: #5C3620; margin-top: 30px;">Stock Sold</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(stockSoldByProduct)
                .map(
                  ([name, data]) =>
                    `<tr><td style="padding: 6px;">${name}</td><td style="padding: 6px;">${computeStockDelta(
                      data.unit,
                      data.qty,
                    ).toFixed(2)}${getStockUnitLabel(data.unit)}</td></tr>`,
                )
                .join('')}
            </table>

            <h2 style="color: #5C3620; margin-top: 30px;">Top Selling Products</h2>
            <img src="${pieChartUrl}" style="width: 100%; max-width: 450px;" />

            <h2 style="color: #5C3620; margin-top: 20px;">Lowest Selling Products</h2>
            <img src="${lowChartUrl}" style="width: 100%; max-width: 500px;" />
          </body>
        </html>
      `;

      const pdf = await generatePDF({
        html,
        fileName: `${shopId}_${reportMode}_${endStr}`,
        base64: false,
      });

      const entry = {
        id: Date.now(),
        label: `${
          reportMode === 'weekly' ? 'Weekly' : 'Monthly'
        }: ${periodLabel}`,
        filePath: pdf.filePath,
        generatedAt: Date.now(),
      };
      const updatedHistory = [entry, ...history];
      setHistory(updatedHistory);
      await AsyncStorage.setItem(
        `${HISTORY_KEY}_${shopId}`,
        JSON.stringify(updatedHistory),
      );

      await Share.open({
        url: `file://${pdf.filePath}`,
        type: 'application/pdf',
      });
    } catch (e: any) {
      setError('Could not generate report: ' + (e.message || 'unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const reopenReport = async (entry: any) => {
    try {
      await Share.open({
        url: `file://${entry.filePath}`,
        type: 'application/pdf',
      });
    } catch (e) {
      setError(
        'Could not open — the file may have been deleted from this device.',
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sale Report</Text>
      <Text style={styles.subtitle}>
        Sales, discounts, expenses, stock movement, top & lowest products
      </Text>

      <View style={styles.modeRow}>
        <AppButton
          label="Weekly"
          onPress={() => setReportMode('weekly')}
          variant={reportMode === 'weekly' ? 'primary' : 'outline'}
          style={{ flex: 1 }}
        />
        <AppButton
          label="Monthly"
          onPress={() => setReportMode('monthly')}
          variant={reportMode === 'monthly' ? 'primary' : 'outline'}
          style={{ flex: 1 }}
        />
      </View>

      {reportMode === 'monthly' && (
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={styles.monthNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthNavLabel}>
            {getMonthLabel(selectedMonth)}
          </Text>
          <TouchableOpacity
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
          >
            <Text
              style={[
                styles.monthNavArrow,
                isCurrentMonth && { color: COLORS.border },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <AppButton
        label="Generate & Share Report"
        onPress={generateReport}
        loading={generating}
      />

      <Card style={{ marginTop: 28 }}>
        <Text style={styles.listTitle}>Past Reports</Text>
        {history.length === 0 && (
          <EmptyState text="No reports generated yet." />
        )}
        {history.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.historyRow}
            onPress={() => reopenReport(entry)}
          >
            <Text style={styles.historyLabel}>{entry.label}</Text>
            <Text style={styles.historyDate}>
              {new Date(entry.generatedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  monthNavArrow: { fontSize: 24, color: COLORS.caramel, fontWeight: '700' },
  monthNavLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.cacaoDark,
    minWidth: 160,
    textAlign: 'center',
  },
  error: { color: COLORS.danger, marginBottom: 12 },
  listTitle: { fontWeight: '700', color: COLORS.cacaoDark, marginBottom: 8 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  historyLabel: { fontSize: 13, color: COLORS.cacaoDark, fontWeight: '500' },
  historyDate: { fontSize: 12, color: COLORS.textFaint },
});

export default WeeklyReport;