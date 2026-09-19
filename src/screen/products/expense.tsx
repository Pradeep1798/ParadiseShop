import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { formatCurrency } from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';
import Card from 'components/Card';
import AppButton from 'components/AppButton';
import AppInput from 'components/AppInput';
import EmptyState from 'components/EmptyState';
import { addExpense, getExpensesByDateRange } from 'services/Service';
import { useFocusRefresh } from 'utils/hooks';
import AnimatedAmount from 'components/AnimatedAmount';
import { Expense as ExpenseRecord } from 'types/Domain';

const Expense = ({
  route,
}: {
  route: { params: { shopId: string; staffName: string } };
}) => {
  const { shopId, staffName } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState<'cash' | 'gpay'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [todaysExpenses, setTodaysExpenses] = useState<ExpenseRecord[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const list = await getExpensesByDateRange(shopId, today, today);
    setTodaysExpenses(list.sort((a, b) => b.timestamp - a.timestamp));
  }, [shopId, today]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

  const submit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!description.trim()) {
      setError('What was this expense for?');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addExpense(shopId, {
        date: today,
        timestamp: Date.now(),
        staffName,
        amount: amountNum,
        paymentMethod: payment,
        description: description.trim(),
      });

      setAmount('');
      setDescription('');
      await load();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  const todaysTotal = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={onRefresh}
      allowWideContent={isTablet}
    >
      <View style={isTablet ? styles.tabletRow : undefined}>
        <View style={isTablet ? styles.tabletFormColumn : undefined}>
          <AppInput
            label="Amount (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="e.g. 150"
          />
          <AppInput
            label="What was this for?"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. foil, tea, auto fare"
          />

          <Text style={styles.label}>Paid via</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                payment === 'cash' && styles.paymentBtnActive,
              ]}
              onPress={() => setPayment('cash')}
            >
              <Text
                style={
                  payment === 'cash' ? styles.pillTextActive : styles.pillText
                }
              >
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                payment === 'gpay' && styles.paymentBtnActive,
              ]}
              onPress={() => setPayment('gpay')}
            >
              <Text
                style={
                  payment === 'gpay' ? styles.pillTextActive : styles.pillText
                }
              >
                GPay
              </Text>
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <AppButton
            label="Save expense"
            onPress={submit}
            loading={saving}
            variant="danger"
            style={{ marginTop: 24 }}
          />
        </View>

        <View style={isTablet ? styles.tabletListColumn : undefined}>
          <Card style={{ marginTop: 28 }}>
            <Text style={styles.listTitle}>
              Today's expenses ({todaysExpenses.length})
            </Text>
            {loading && (
              <ActivityIndicator style={{ marginTop: 10 }} color="#7A4A2B" />
            )}
            {!loading && todaysExpenses.length === 0 && (
              <EmptyState text="No expenses logged today yet." />
            )}
            {todaysExpenses.map(e => (
              <View key={e.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listDesc}>{e.description}</Text>
                  <Text style={styles.listMeta}>
                    {e.staffName} ·{' '}
                    {e.paymentMethod === 'gpay' ? 'GPay' : 'Cash'}
                  </Text>
                </View>
                <Text style={styles.listAmount}>
                  {formatCurrency(e.amount)}
                </Text>
              </View>
            ))}
            {todaysExpenses.length > 0 && (
              <View style={styles.listTotalRow}>
                <Text style={styles.listTotalLabel}>Total</Text>
                <AnimatedAmount
                  value={todaysTotal}
                  style={styles.listTotalValue}
                />
              </View>
            )}
          </Card>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabletFormColumn: {
    flex: 0.85,
    marginRight: 12,
  },
  tabletListColumn: {
    flex: 1.15,
    marginLeft: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    marginTop: 16,
    marginBottom: 8,
  },
  presetRow: { flexDirection: 'row', gap: 8 },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  paymentBtnActive: { backgroundColor: '#9C3654', borderColor: '#9C3654' },
  pillText: { color: '#2B160C', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  error: { color: '#9C3654', marginTop: 12 },
  listTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  listDesc: { fontSize: 13.5, color: '#2B160C', fontWeight: '500' },
  listMeta: { fontSize: 11, color: '#9C8768', marginTop: 2 },
  listAmount: { fontSize: 13.5, fontWeight: '600', color: '#9C3654' },
  listTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2CFAF',
  },
  listTotalLabel: { fontWeight: '700', color: '#2B160C' },
  listTotalValue: { fontWeight: '700', color: '#9C3654', fontSize: 15 },
});

export default Expense;