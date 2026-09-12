import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
} from '@react-native-firebase/firestore';
import ScreenContainer from 'components/ScreenContainer';

const uid = () => Math.random().toString(36).slice(2, 10);

const Catalogue = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<any>(null); // { categoryId, subVariety } or null
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null); // categoryId
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

  const toggleCategory = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const saveItem = async (
    categoryId: string,
    updatedItem: any,
    isNew: boolean,
  ) => {
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const category = categories.find(c => c.id === categoryId);
      let updatedSubVarieties;
      if (isNew) {
        updatedSubVarieties = [...(category.subVarieties || []), updatedItem];
      } else {
        updatedSubVarieties = category.subVarieties.map((sv: any) =>
          sv.id === updatedItem.id ? updatedItem : sv,
        );
      }
      await updateDoc(doc(db, 'shops', shopId, 'categories', categoryId), {
        subVarieties: updatedSubVarieties,
      });
      setEditingItem(null);
      setAddingItemTo(null);
      await loadCategories();
    } catch (e) {
      setError('Could not save — try again');
    } finally {
      setSaving(false);
    }
  };

  const saveNewCategory = async (name: string) => {
    if (!name.trim()) {
      setError('Enter a category name');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const categoryId = name.trim().toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, 'shops', shopId, 'categories', categoryId), {
        name: name.trim(),
        subVarieties: [],
      });
      setAddingCategory(false);
      await loadCategories();
    } catch (e) {
      setError('Could not create category — try again');
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
    <>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Catalogue</Text>
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => setAddingCategory(true)}
          >
            <Text style={styles.addCategoryBtnText}>+ Category</Text>
          </TouchableOpacity>
        </View>

        {categories.map(cat => {
          const isOpen = !!expanded[cat.id];
          return (
            <View key={cat.id} style={styles.categoryBox}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <>
                  {(cat.subVarieties || []).map((sv: any) => (
                    <TouchableOpacity
                      key={sv.id}
                      style={styles.itemRow}
                      onPress={() =>
                        setEditingItem({ categoryId: cat.id, subVariety: sv })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{sv.name}</Text>
                        <Text style={styles.itemMeta}>
                          ₹{sv.pricePerKg}/kg · stock: {sv.stock} · low at:{' '}
                          {sv.lowStockThreshold}
                        </Text>
                      </View>
                      <Text style={styles.editIcon}>✎</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.addItemBtn}
                    onPress={() => setAddingItemTo(cat.id)}
                  >
                    <Text style={styles.addItemBtnText}>
                      + Add item to {cat.name}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScreenContainer>

      {!!editingItem && (
        <ItemEditor
          initial={editingItem.subVariety}
          isNew={false}
          saving={saving}
          error={error}
          onCancel={() => {
            setEditingItem(null);
            setError('');
          }}
          onSave={(item: any) => saveItem(editingItem.categoryId, item, false)}
        />
      )}

      {!!addingItemTo && (
        <ItemEditor
          initial={{
            id: uid(),
            name: '',
            unit: 'g',
            pricePerKg: 0,
            stock: 0,
            lowStockThreshold: 5,
            presetAmounts: [],
          }}
          isNew={true}
          saving={saving}
          error={error}
          onCancel={() => {
            setAddingItemTo(null);
            setError('');
          }}
          onSave={(item: any) => saveItem(addingItemTo, item, true)}
        />
      )}

      {addingCategory && (
        <CategoryEditor
          saving={saving}
          error={error}
          onCancel={() => {
            setAddingCategory(false);
            setError('');
          }}
          onSave={saveNewCategory}
        />
      )}
    </>
  );
};

function ItemEditor({ initial, isNew, saving, error, onCancel, onSave }: any) {
  const [name, setName] = useState(initial.name);
  const [unit, setUnit] = useState(initial.unit);
  const [pricePerKg, setPricePerKg] = useState(String(initial.pricePerKg));
  const [stock, setStock] = useState(String(initial.stock));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initial.lowStockThreshold),
  );
  const [presetAmounts, setPresetAmounts] = useState(
    (initial.presetAmounts || []).join(', '),
  );

  const submit = () => {
    onSave({
      id: initial.id,
      name: name.trim(),
      unit,
      pricePerKg: Number(pricePerKg) || 0,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 0,
      presetAmounts: presetAmounts
        .split(',')
        .map((s: any) => Number(s.trim()))
        .filter((n: any) => !isNaN(n) && n > 0),
    });
  };

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.modalBackdrop}>
        <ScrollView style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            {isNew ? 'Add Item' : 'Edit Item'}
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Eucalyptus - Pure"
          />

          <Text style={styles.label}>Unit</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['g', 'ml', 'pcs'].map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={
                    unit === u ? styles.unitBtnTextActive : styles.unitBtnText
                  }
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Price per{' '}
            {unit === 'ml' ? 'litre' : unit === 'pcs' ? 'piece' : 'kg'} (₹)
          </Text>
          <TextInput
            style={styles.input}
            value={pricePerKg}
            onChangeText={setPricePerKg}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Current stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Low stock alert below</Text>
          <TextInput
            style={styles.input}
            value={lowStockThreshold}
            onChangeText={setLowStockThreshold}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>
            Preset amounts (comma separated, e.g. 100, 200, 250)
          </Text>
          <TextInput
            style={styles.input}
            value={presetAmounts}
            onChangeText={setPresetAmounts}
            placeholder="100, 200, 250"
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function CategoryEditor({ saving, error, onCancel, onSave }: any) {
  const [name, setName] = useState('');
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>New Category</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Spices"
            autoFocus
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onSave(name)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    // paddingTop: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  addCategoryBtn: {
    backgroundColor: '#5C3620',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addCategoryBtnText: { color: '#fff', fontWeight: '600', fontSize: 12.5 },
  categoryBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#5C3620' },
  chevron: { fontSize: 16, color: '#C17A3D' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2B160C' },
  itemMeta: { fontSize: 11.5, color: '#9C8768', marginTop: 2 },
  editIcon: { fontSize: 15, color: '#C17A3D' },
  addItemBtn: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  addItemBtnText: { color: '#5C7D57', fontWeight: '600', fontSize: 12.5 },
  overlayContainer: { ...StyleSheet.absoluteFill, zIndex: 999, elevation: 999 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,22,12,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B160C',
    marginBottom: 14,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7A4A2B',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FBF4EC',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2B160C',
  },
  unitBtn: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unitBtnActive: { backgroundColor: '#5C3620', borderColor: '#5C3620' },
  unitBtnText: { color: '#2B160C', fontWeight: '500' },
  unitBtnTextActive: { color: '#fff', fontWeight: '600' },
  error: { color: '#9C3654', marginTop: 10 },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3E6D5',
  },
  cancelBtnText: { color: '#5C3620', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#5C3620',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});

export default Catalogue;
