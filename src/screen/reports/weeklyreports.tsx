import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeStockDelta, getStockUnitLabel } from 'utils/HelperFn';

const HISTORY_KEY = 'weekly_report_history';

const WeeklyReport = ({ route }: any) => {
  const { shopId, shopName } = route.params;
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

  const generateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const db = getFirestore();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      const txSnap = await getDocs(
        query(
          collection(db, 'shops', shopId, 'transactions'),
          where('date', '>=', startStr),
        ),
      );
      const expSnap = await getDocs(
        query(
          collection(db, 'shops', shopId, 'expenses'),
          where('date', '>=', startStr),
        ),
      );

      const allTx = txSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const sales = allTx.filter((t: any) => t.type === 'sale');
      const returns = allTx.filter((t: any) => t.type === 'return');
      const stockIns = allTx.filter((t: any) => t.type === 'stock_in');

      let cashTotal = 0,
        gpayTotal = 0,
        discountTotal = 0;
      sales.forEach((t: any) => {
        if (t.paymentMethod === 'gpay') gpayTotal += t.finalAmount;
        else cashTotal += t.finalAmount;
        discountTotal += t.discount || 0;
      });
      returns.forEach((r: any) => {
        const original = sales.find(
          (s: any) => s.id === r.originalTransactionId,
        );
        if (!original) return;
        if (original.paymentMethod === 'gpay') gpayTotal -= r.refundAmount;
        else cashTotal -= r.refundAmount;
      });

      // Expenses — total + itemized
      const expenseByDesc: Record<string, number> = {};
      expSnap.docs.forEach(d => {
        const e = d.data() as any;
        const key = e.description.trim();
        expenseByDesc[key] = (expenseByDesc[key] || 0) + e.amount;
      });
      const expenseTotal = Object.values(expenseByDesc).reduce(
        (s, v) => s + v,
        0,
      );

      // Stock In — per product totals
      const stockInByProduct: Record<string, { qty: number; unit: string }> =
        {};
      stockIns.forEach((t: any) => {
        const key = t.subVarietyName;
        if (!stockInByProduct[key])
          stockInByProduct[key] = { qty: 0, unit: t.unit };
        stockInByProduct[key].qty += t.quantity;
      });

      const stockSoldByProduct: Record<string, { qty: number; unit: string }> =
        {};
      sales.forEach((t: any) => {
        const key = t.subVarietyName;
        if (!stockSoldByProduct[key])
          stockSoldByProduct[key] = { qty: 0, unit: t.unit };
        stockSoldByProduct[key].qty += t.quantity;
      });
      returns.forEach((r: any) => {
        const original = sales.find(
          (s: any) => s.id === r.originalTransactionId,
        );
        if (!original) return;
        const key = original.subVarietyName;
        if (stockSoldByProduct[key]) {
          stockSoldByProduct[key].qty -= r.quantity;
        }
      });
      // Rank products by quantity sold
      const byProduct: Record<string, number> = {};
      sales.forEach((t: any) => {
        byProduct[t.subVarietyName] =
          (byProduct[t.subVarietyName] || 0) + t.quantity;
      });
      const ranked = Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
      const top5 = ranked.slice(0, 5);
      const bottom5 = ranked.slice(-5).reverse();
      const pieChartConfig = {
        type: 'pie',
        data: {
          labels: top5.map(([name]) => name),
          datasets: [
            {
              data: top5.map(([, qty]) => qty),
              backgroundColor: [
                '#C17A3D',
                '#5C7D57',
                '#9C3654',
                '#5C3620',
                '#B8871E',
              ],
            },
          ],
        },
        options: {
          title: { display: true, text: 'Top 5 Products (quantity sold)' },
          plugins: {
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 12 },
              formatter: (value: number) => value,
            },
          },
        },
      };
      const pieChartUrl = `https://quickchart.io/chart?width=500&height=300&c=${encodeURIComponent(
        JSON.stringify(pieChartConfig),
      )}`;

      const lowChartConfig = {
        type: 'pie',
        data: {
          labels: bottom5.map(([name]) => name),
          datasets: [
            {
              data: bottom5.map(([, qty]) => qty),
              backgroundColor: [
                '#9C3654',
                '#C17A3D',
                '#5C7D57',
                '#5C3620',
                '#B8871E',
              ],
            },
          ],
        },
        options: {
          title: { display: true, text: 'Lowest 5 Products (quantity sold)' },
          plugins: {
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 12 },
              formatter: (value: number) => value,
            },
          },
        },
      };
      const lowChartUrl = `https://quickchart.io/chart?width=500&height=300&c=${encodeURIComponent(
        JSON.stringify(lowChartConfig),
      )}`;

      const html = `
        <html>
          <body style="font-family: Helvetica; padding: 24px; color: #2B160C;">
            <h1 style="color: #5C3620;">${shopName} — Weekly Report</h1>
            <p style="color: #7A4A2B;">${startStr} to ${endStr}</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 8px; font-weight: bold;">Total Sale</td><td style="padding: 8px;">₹${(
                cashTotal + gpayTotal
              ).toFixed(2)}</td></tr>
              <tr style="background: #FBF4EC;"><td style="padding: 8px; font-weight: bold;">Cash</td><td style="padding: 8px;">₹${cashTotal.toFixed(
                2,
              )}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">GPay</td><td style="padding: 8px;">₹${gpayTotal.toFixed(
                2,
              )}</td></tr>
              <tr style="background: #FBF4EC;"><td style="padding: 8px; font-weight: bold;">Total Discount Given</td><td style="padding: 8px;">₹${discountTotal.toFixed(
                2,
              )}</td></tr>
            </table>

            <h2 style="color: #5C3620; margin-top: 30px;">Expenses — Total: ₹${expenseTotal.toFixed(
              2,
            )}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(expenseByDesc)
                .map(
                  ([desc, amt]) =>
                    `<tr><td style="padding: 6px;">${desc}</td><td style="padding: 6px;">₹${amt.toFixed(
                      2,
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
        fileName: `${shopId}_report_${endStr}`,
        base64: false,
      });

      const entry = {
        id: Date.now(),
        label: `${startStr} to ${endStr}`,
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
      <Text style={styles.title}>Weekly Report</Text>
      <Text style={styles.subtitle}>
        Last 7 days — sales, discounts, expenses, stock in, top & lowest
        products
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={generateReport}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate & Share Report</Text>
        )}
      </TouchableOpacity>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>Past Reports</Text>
        {history.length === 0 && (
          <Text style={styles.empty}>No reports generated yet.</Text>
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
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginTop: 4, marginBottom: 20 },
  error: { color: '#9C3654', marginBottom: 12 },
  button: {
    backgroundColor: '#C17A3D',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listBox: {
    marginTop: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 16,
  },
  listTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  empty: { color: '#7A4A2B', fontSize: 13 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  historyLabel: { fontSize: 13, color: '#2B160C', fontWeight: '500' },
  historyDate: { fontSize: 12, color: '#9C8768' },
});

export default WeeklyReport;
