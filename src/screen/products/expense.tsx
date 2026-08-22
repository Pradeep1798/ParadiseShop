import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { getFirestore, collection, addDoc } from '@react-native-firebase/firestore';

const Expense = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState<'cash' | 'gpay'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
        date: new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        staffName,
        amount: amountNum,
        paymentMethod: payment,
        description: description.trim(),
      });

      setAmount('');
      setDescription('');
      navigation.goBack();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
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
        placeholder="e.g. packaging covers, auto fare"
      />

      <Text style={styles.label}>Paid via</Text>
      <View style={styles.presetRow}>
        <TouchableOpacity
          style={[styles.paymentBtn, payment === 'cash' && styles.paymentBtnActive]}
          onPress={() => setPayment('cash')}
        >
          <Text style={payment === 'cash' ? styles.pillTextActive : styles.pillText}>Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentBtn, payment === 'gpay' && styles.paymentBtnActive]}
          onPress={() => setPayment('gpay')}
        >
          <Text style={payment === 'gpay' ? styles.pillTextActive : styles.pillText}>GPay</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save expense</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF4EC', padding: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#7A4A2B', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12, fontSize: 16 },
  presetRow: { flexDirection: 'row', gap: 8 },
  paymentBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12, alignItems: 'center' },
  paymentBtnActive: { backgroundColor: '#9C3654', borderColor: '#9C3654' },
  pillText: { color: '#2B160C', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  error: { color: '#9C3654', marginTop: 12 },
  button: { marginTop: 24, backgroundColor: '#9C3654', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default Expense;