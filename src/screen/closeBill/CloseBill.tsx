import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';
import {
  computeCashGpayTotals,
  applyReturnsToTotals,
  excludeVoided,
} from 'utils/SalesCalculation';
import AppInput from 'components/AppInput';
import AppButton from 'components/AppButton';
import Card from 'components/Card';
import StatRow from 'components/StatRow';
import { COLORS, SPACING, FONT_SIZE } from 'theme/Theme';
import { formatCurrency } from 'utils/HelperFn';
import { StyleSheet } from 'react-native';
import {
  getDailyClosing,
  getExpensesByDateRange,
  getTransactionsForDate,
} from 'services/Service';
import { useFocusRefresh } from 'utils/hooks';

const CloseBill = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params || {};
  const today = new Date().toISOString().slice(0, 10);

  const [summary, setSummary] = useState<any>(null);
  const [alreadyClosed, setAlreadyClosed] = useState<any>(null);
  const [excessOrShortage, setExcessOrShortage] = useState('0');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const closing = await getDailyClosing(shopId, today);
    setAlreadyClosed(closing);

    const [allTx, expenses] = await Promise.all([
      getTransactionsForDate(shopId, today),
      getExpensesByDateRange(shopId, today, today),
    ]);

    const sales = excludeVoided(allTx.filter(t => t.type === 'sale'));
    const returns = allTx.filter(t => t.type === 'return');

    const rawTotals = computeCashGpayTotals(sales);
    const { cash, gpay } = applyReturnsToTotals(rawTotals, sales, returns);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    setSummary({
      sale: cash + gpay,
      cash,
      gpay,
      expenseTotal,
      calculatedHand: cash - expenseTotal,
    });
  }, [shopId, today]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const diff = Number(excessOrShortage) || 0;
      await setDoc(doc(db, 'shops', shopId, 'dailyClosings', today), {
        date: today,
        closedBy: staffName,
        closedAt: Date.now(),
        calculatedSale: summary.sale,
        calculatedCash: summary.cash,
        calculatedGpay: summary.gpay,
        calculatedExpense: summary.expenseTotal,
        calculatedHand: summary.calculatedHand,
        excessOrShortage: diff,
        finalHand: summary.calculatedHand + diff,
        note: note.trim() || null,
      });
      navigation.navigate('Home', route.params);
    } catch (e) {
      setError('Could not close the bill — try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Close Today's Bill</Text>
      <Text style={styles.subtitle}>{today}</Text>

      {alreadyClosed && (
        <Card style={styles.warningBox}>
          <Text style={styles.warningText}>
            Already closed by {alreadyClosed.closedBy} at{' '}
            {new Date(alreadyClosed.closedAt).toLocaleTimeString()}. Submitting
            again will overwrite that record.
          </Text>
        </Card>
      )}

      <Card>
        <StatRow label="Sale" value={summary.sale} tone="income" />
        <StatRow label="Cash" value={summary.cash} tone="income" />
        <StatRow label="GPay" value={summary.gpay} tone="income" />
        <StatRow label="Expenses" value={summary.expenseTotal} tone="expense" />
        <StatRow
          label="Calculated Hand"
          value={summary.calculatedHand}
          tone="neutral"
          bold
        />
      </Card>

      <AppInput
        label="Excess (+) or Shortage (−) amount (₹)"
        value={excessOrShortage}
        onChangeText={setExcessOrShortage}
        keyboardType="numbers-and-punctuation"
        placeholder="0 (enter negative for shortage, e.g. -50)"
      />

      <AppInput
        label="Note"
        value={note}
        onChangeText={setNote}
        placeholder="e.g. missed one bill during rush, found extra 50 in till"
        multiline
      />

      <Card style={styles.finalBox}>
        <Text style={styles.finalLabel}>Final Hand (after adjustment)</Text>
        <Text style={styles.finalValue}>
          {formatCurrency(
            summary.calculatedHand + (Number(excessOrShortage) || 0),
          )}
        </Text>
      </Card>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <AppButton
        label="Confirm & Close"
        onPress={submit}
        loading={saving}
        style={{ marginTop: 20 }}
      />

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
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  warningBox: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger },
  warningText: { color: COLORS.danger, fontSize: 12.5 },
  finalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.creamAlt,
  },
  finalLabel: { fontWeight: '700', color: COLORS.cacao },
  finalValue: { fontWeight: '800', fontSize: 18, color: COLORS.cacao },
  error: { color: COLORS.danger, marginTop: 12 },
});

export default CloseBill;