import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from '@react-native-firebase/firestore';
import ScreenContainer from 'components/ScreenContainer';
import { getStockUnitLabel } from 'utils/HelperFn';

const Stock = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [qty, setQty] = useState('');
  const [itemNote, setItemNote] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [shopId]);

  React.useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, [loadCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const addToCart = () => {
    const quantity = parseFloat(qty);
    if (!selectedCategory || !selectedSub || !quantity || quantity <= 0) {
      setError('Pick a category, sub-variety, and enter a valid quantity');
      return;
    }
    setCart(prev => [
      ...prev,
      {
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        subVarietyId: selectedSub.id,
        subVarietyName: selectedSub.name,
        quantity,
        unit: selectedSub.unit, // ← add this
        note: itemNote.trim() || null,
      },
    ]);
    setSelectedCategory(null);
    setSelectedSub(null);
    setQty('');
    setItemNote('');
    setError('');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const submitAll = async () => {
    if (cart.length === 0) {
      setError('Add at least one item before submitting');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const batchId = `${Date.now()}_${staffName}`;

      // Group by category so each category document is updated once with all its additions
      const byCategory: Record<string, any[]> = {};
      cart.forEach(item => {
        if (!byCategory[item.categoryId]) byCategory[item.categoryId] = [];
        byCategory[item.categoryId].push(item);
      });

      for (const categoryId of Object.keys(byCategory)) {
        const category = categories.find(c => c.id === categoryId);
        const itemsForThisCategory = byCategory[categoryId];

        const updatedSubVarieties = category.subVarieties.map((sv: any) => {
          const additions = itemsForThisCategory
            .filter(i => i.subVarietyId === sv.id)
            .reduce((sum, i) => sum + i.quantity, 0);
          return additions > 0 ? { ...sv, stock: sv.stock + additions } : sv;
        });

        await updateDoc(doc(db, 'shops', shopId, 'categories', categoryId), {
          subVarieties: updatedSubVarieties,
        });
      }

      for (const item of cart) {
        await addDoc(collection(db, 'shops', shopId, 'transactions'), {
          type: 'stock_in',
          batchId,
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
          staffName,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          subVarietyId: item.subVarietyId,
          subVarietyName: item.subVarietyName,
          quantity: item.quantity,
          unit: item.unit,
          note: item.note,
        });
      }

      setCart([]);
      navigation.goBack();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Stock In</Text>

      {cart.length > 0 && (
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>
            To be added ({cart.length} item{cart.length > 1 ? 's' : ''})
          </Text>
          {cart.map((item, i) => (
            <View key={i} style={styles.cartRow}>
              <Text style={styles.cartItemText}>
                {item.subVarietyName} — + {item.quantity}
                {getStockUnitLabel(item.unit)}
                {item.note ? ` (${item.note})` : ''}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(i)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.wrapRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              selectedCategory?.id === cat.id && styles.pillActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setSelectedSub(null);
            }}
          >
            <Text
              style={
                selectedCategory?.id === cat.id
                  ? styles.pillTextActive
                  : styles.pillText
              }
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCategory && (
        <>
          <Text style={styles.label}>Sub-variety</Text>
          <View style={styles.wrapRow}>
            {selectedCategory.subVarieties.map((sv: any) => (
              <TouchableOpacity
                key={sv.id}
                style={[
                  styles.pill,
                  selectedSub?.id === sv.id && styles.pillActive,
                ]}
                onPress={() => setSelectedSub(sv)}
              >
                <Text
                  style={
                    selectedSub?.id === sv.id
                      ? styles.pillTextActive
                      : styles.pillText
                  }
                >
                  {sv.name} (current: {sv.stock.toFixed(2)}
                  {''} {getStockUnitLabel(sv.unit)})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {selectedSub && (
        <>
          <Text style={styles.label}>
            Quantity received ({getStockUnitLabel(selectedSub.unit)})
          </Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            placeholder="e.g. 20"
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            value={itemNote}
            onChangeText={setItemNote}
            placeholder="e.g. supplier name, invoice no."
          />

          <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
            <Text style={styles.addBtnText}>+ Add to list</Text>
          </TouchableOpacity>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.button}
          onPress={submitAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm all ({cart.length})</Text>
          )}
        </TouchableOpacity>
      )}

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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    marginTop: 16,
    marginBottom: 8,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  pillActive: { backgroundColor: '#5C3620', borderColor: '#5C3620' },
  pillText: { color: '#2B160C', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  addBtn: {
    marginTop: 16,
    backgroundColor: '#5C7D57',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cartBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  cartTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  cartItemText: { fontSize: 13, color: '#2B160C', flex: 1 },
  removeText: { color: '#9C3654', fontWeight: '700', fontSize: 15 },
  error: { color: '#9C3654', marginTop: 12 },
  button: {
    marginTop: 24,
    backgroundColor: '#5C7D57',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default Stock;
