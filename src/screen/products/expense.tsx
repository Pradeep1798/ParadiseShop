import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from '@react-native-firebase/firestore';
import ScreenContainer from 'components/ScreenContainer';

const Expense = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState<'cash' | 'gpay'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [todaysExpenses, setTodaysExpenses] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadTodaysExpenses = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'expenses'),
        where('date', '==', today),
      ),
    );
    const list = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((e: any) => e.date === today)
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    setTodaysExpenses(list);
  }, [shopId, today]);

  React.useEffect(() => {
    loadTodaysExpenses().finally(() => setLoadingList(false));
  }, [loadTodaysExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodaysExpenses();
    setRefreshing(false);
  };

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
      const db = getFirestore();
      await addDoc(collection(db, 'shops', shopId, 'expenses'), {
        date: today,
        timestamp: Date.now(),
        staffName,
        amount: amountNum,
        paymentMethod: payment,
        description: description.trim(),
      });

      setAmount('');
      setDescription('');
      await loadTodaysExpenses();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  const todaysTotal = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Expense</Text>

      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="e.g. 150"
      />

      <Text style={styles.label}>What was this for?</Text>
      <TextInput
        style={styles.input}
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
            style={payment === 'cash' ? styles.pillTextActive : styles.pillText}
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
            style={payment === 'gpay' ? styles.pillTextActive : styles.pillText}
          >
            GPay
          </Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={submit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save expense</Text>
        )}
      </TouchableOpacity>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>
          Today's expenses ({todaysExpenses.length})
        </Text>
        {loadingList && (
          <ActivityIndicator style={{ marginTop: 10 }} color="#7A4A2B" />
        )}
        {!loadingList && todaysExpenses.length === 0 && (
          <Text style={styles.empty}>No expenses logged today yet.</Text>
        )}
        {todaysExpenses.map(e => (
          <View key={e.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listDesc}>{e.description}</Text>
              <Text style={styles.listMeta}>
                {e.staffName} · {e.paymentMethod === 'gpay' ? 'GPay' : 'Cash'}
              </Text>
            </View>
            <Text style={styles.listAmount}>₹{e.amount.toFixed(2)}</Text>
          </View>
        ))}
        {todaysExpenses.length > 0 && (
          <View style={styles.listTotalRow}>
            <Text style={styles.listTotalLabel}>Total</Text>
            <Text style={styles.listTotalValue}>₹{todaysTotal.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B160C',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
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
  button: {
    marginTop: 24,
    backgroundColor: '#9C3654',
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
