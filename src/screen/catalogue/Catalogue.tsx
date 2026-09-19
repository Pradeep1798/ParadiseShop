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
  useWindowDimensions,
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
import AppButton from 'components/AppButton';
import AppInput from 'components/AppInput';
import ModalOverlay from 'components/ModalOverlay';
import PillGroup from 'components/PillGroup';
import { copyShopCatalogue } from 'services/Service';
import { COLORS } from 'theme/Theme';
import { Category, SubVariety } from 'types/Domain';

interface EditingItem {
  categoryId: string;
  subVariety: SubVariety;
}

interface ItemEditorProps {
  initial: SubVariety;
  isNew: boolean;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (item: SubVariety) => void;
}

interface CategoryEditorProps {
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const Catalogue = ({ route }: { route: { params: { shopId: string } } }) => {
  const { shopId } = route.params || {};
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null); // categoryId
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState(false);

  const loadCategories = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
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
    updatedItem: SubVariety,
    isNew: boolean,
  ) => {
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const category = categories.find(c => c.id === categoryId);
      let updatedSubVarieties: SubVariety[];
      if (isNew) {
        updatedSubVarieties = [...(category.subVarieties || []), updatedItem];
      } else {
        updatedSubVarieties = category.subVarieties.map((sv: SubVariety) =>
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

  const handleCopyFromShopA = async () => {
    setCopying(true);
    try {
      const count = await copyShopCatalogue('shopA', shopId); // adjust 'shopA' to your actual shop A doc ID
      setCopyConfirm(false);
      await loadCategories(); // however your Catalogue screen refreshes its list
      // maybe show a success message with `count` categories copied
    } catch (e) {
      console.log('Copy failed:', e);
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <ScreenContainer
        refreshing={refreshing}
        onRefresh={onRefresh}
        allowWideContent={isTablet}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Catalogue</Text>
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => setAddingCategory(true)}
          >
            <Text style={styles.addCategoryBtnText}>+ Category</Text>
          </TouchableOpacity>
        </View>

        <View style={isTablet ? styles.tabletGrid : undefined}>
          {categories.map(cat => {
            const isOpen = !!expanded[cat.id];
            return (
              <View
                key={cat.id}
                style={[
                  styles.categoryBox,
                  isTablet && styles.tabletCategoryBox,
                ]}
              >
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <>
                    {cat.subVarieties.map((sv: SubVariety) => (
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
        </View>

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
          onSave={item => saveItem(editingItem.categoryId, item, false)}
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
          onSave={item => saveItem(addingItemTo, item, true)}
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
      {categories.length === 0 && (
        <AppButton
          label={copying ? 'Copying…' : 'Copy Catalogue from Shop A'}
          onPress={() => setCopyConfirm(true)}
          loading={copying}
          variant="outline"
        />
      )}

      <ModalOverlay visible={copyConfirm}>
        <Text style={styles.modalTitle}>Copy Shop A's Catalogue?</Text>
        <Text style={styles.modalMeta}>
          This copies every category, product, and price from Shop A into this
          shop. Stock will start at 0 — you'll need to do a real Stock In
          afterward.
        </Text>
        <View style={styles.modalButtonRow}>
          <AppButton
            label="Cancel"
            variant="outline"
            onPress={() => setCopyConfirm(false)}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Copy Now"
            onPress={handleCopyFromShopA}
            loading={copying}
            style={{ flex: 1 }}
          />
        </View>
      </ModalOverlay>
    </>
  );
};

function ItemEditor({
  initial,
  isNew,
  saving,
  error,
  onCancel,
  onSave,
}: ItemEditorProps) {
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
        .map((s: string) => Number(s.trim()))
        .filter((n: number) => !isNaN(n) && n > 0),
    });
  };

  return (
    <ModalOverlay visible>
      <Text style={styles.modalTitle}>{isNew ? 'Add Item' : 'Edit Item'}</Text>

      <AppInput
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Eucalyptus - Pure"
        editable={!saving}
        style={styles.catalogueInput}
      />

      <Text style={styles.label}>Unit</Text>

      <PillGroup
        options={[
          { key: 'g', label: 'g' },
          { key: 'ml', label: 'ml' },
          { key: 'pcs', label: 'pcs' },
        ]}
        selectedKey={unit}
        onSelect={setUnit}
        equalWidth
      />

      <AppInput
        label={`Price per ${
          unit === 'ml' ? 'litre' : unit === 'pcs' ? 'piece' : 'kg'
        } (₹)`}
        value={pricePerKg}
        onChangeText={setPricePerKg}
        keyboardType="decimal-pad"
        editable={!saving}
        style={styles.catalogueInput}
      />

      <AppInput
        label="Current stock"
        value={stock}
        onChangeText={setStock}
        keyboardType="decimal-pad"
        editable={!saving}
        style={styles.catalogueInput}
      />

      <AppInput
        label="Low stock alert below"
        value={lowStockThreshold}
        onChangeText={setLowStockThreshold}
        keyboardType="decimal-pad"
        editable={!saving}
        style={styles.catalogueInput}
      />

      <AppInput
        label="Preset amounts (comma separated, e.g. 100, 200, 250)"
        value={presetAmounts}
        onChangeText={setPresetAmounts}
        placeholder="100, 200, 250"
        editable={!saving}
        style={styles.catalogueInput}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.modalButtonRow}>
        <AppButton
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={saving}
          style={styles.modalActionButton}
        />

        <AppButton
          label="Save"
          variant="primary"
          onPress={submit}
          loading={saving}
          disabled={saving}
          style={styles.modalActionButton}
        />
      </View>
    </ModalOverlay>
  );
}

function CategoryEditor({
  saving,
  error,
  onCancel,
  onSave,
}: CategoryEditorProps) {
  const [name, setName] = useState('');

  return (
    <ModalOverlay visible>
      <Text style={styles.modalTitle}>New Category</Text>

      <AppInput
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Spices"
        autoFocus
        editable={!saving}
        style={styles.catalogueInput}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.modalButtonRow}>
        <AppButton
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={saving}
          style={styles.modalActionButton}
        />

        <AppButton
          label="Create"
          variant="primary"
          onPress={() => onSave(name)}
          loading={saving}
          disabled={saving}
          style={styles.modalActionButton}
        />
      </View>
    </ModalOverlay>
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
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletCategoryBox: {
    width: '48.5%',
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
  catalogueInput: {
    backgroundColor: '#FBF4EC',
    borderColor: '#E2CFAF',
  },

  modalActionButton: {
    flex: 1,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
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
