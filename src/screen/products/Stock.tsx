import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getCategories,
  updateCategoryStock,
  addTransaction,
} from 'services/Service';

import { useFocusRefresh } from 'utils/hooks';
import { getStockUnitLabel, roundStock } from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';
import { COLORS } from 'theme/Theme';

const Stock = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params;

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [qty, setQty] = useState('');
  const [itemNote, setItemNote] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await getCategories(shopId);
    setCategories(data);
  }, [shopId]);

  useFocusRefresh(load, [load]);

  const addToCart = () => {
    if (!selectedCategory || !selectedSub) {
      setError('Please select a category and sub-item');
      return;
    }

    const quantity = Number(qty);

    if (!qty.trim() || Number.isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const unit = selectedSub.unit || selectedCategory.unit || '';

    setCart(prev => [
      ...prev,
      {
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        subVarietyId: selectedSub.id,
        subVarietyName: selectedSub.name,
        quantity,
        unit,
        note: itemNote.trim(),
      },
    ]);

    setSelectedSub(null);
    setQty('');
    setItemNote('');
    setError('');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const submitAll = async () => {
    if (!cart.length) return;

    setSaving(true);
    setError('');

    try {
      const grouped: Record<string, any[]> = {};

      cart.forEach(item => {
        if (!grouped[item.categoryId]) {
          grouped[item.categoryId] = [];
        }

        grouped[item.categoryId].push(item);
      });

      for (const categoryId of Object.keys(grouped)) {
        const category = categories.find(c => c.id === categoryId);

        if (!category) continue;

        const updatedSubVarieties = [...(category.subVarieties || [])];

        grouped[categoryId].forEach(item => {
          const index = updatedSubVarieties.findIndex(
            (sub: any) => sub.id === item.subVarietyId,
          );

          if (index !== -1) {
            const currentStock = Number(updatedSubVarieties[index].stock || 0);
            const nextStock = roundStock(currentStock + item.quantity);

            updatedSubVarieties[index] = {
              ...updatedSubVarieties[index],
              stock: nextStock,
            };
          }
        });

        await updateCategoryStock(shopId, categoryId, updatedSubVarieties);

        for (const item of grouped[categoryId]) {
          await addTransaction(shopId, {
            type: 'stock_in',
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            subVarietyId: item.subVarietyId,
            subVarietyName: item.subVarietyName,
            quantity: item.quantity,
            unit: item.unit,
            note: item.note || null,
            staffName,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
          });
        }
      }

      setCart([]);
      await load();

      navigation.navigate('Home');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSubVarieties = () => {
    if (!selectedCategory) return [];

    return selectedCategory.subVarieties || [];
  };

  const selectedUnit = selectedSub
    ? getStockUnitLabel(selectedSub.unit || selectedCategory?.unit || '')
    : '';

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>＋</Text>
          </View>

          <View style={styles.headerTextBox}>
            <Text style={styles.title}>Stock In</Text>
            <Text style={styles.subtitle}>Add new stock to your inventory</Text>
          </View>
        </View>

        {/* CART */}
        {cart.length > 0 && (
          <View style={styles.cartBox}>
            <View style={styles.cartHeader}>
              <View style={styles.cartHeaderLeft}>
                <View style={styles.cartIcon}>
                  <Text style={styles.cartIconText}>🛒</Text>
                </View>

                <View>
                  <Text style={styles.cartTitle}>To be added</Text>
                  <Text style={styles.cartSubtitle}>
                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setCart([])} activeOpacity={0.7}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cartItems}>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartRow}>
                  <View style={styles.cartItemIndicator} />

                  <View style={styles.cartItemContent}>
                    <Text style={styles.cartItemName}>
                      {item.subVarietyName}
                    </Text>

                    <Text style={styles.cartItemQuantity}>
                      +{item.quantity}
                      {getStockUnitLabel(item.unit)}
                    </Text>

                    <View style={styles.cartMetaRow}>
                      <Text style={styles.cartCategory}>
                        {item.categoryName}
                      </Text>

                      {!!item.note && (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.cartNote} numberOfLines={1}>
                            {item.note}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCart(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CATEGORY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map(category => {
              const active = selectedCategory?.id === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    active && styles.categoryPillActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setSelectedSub(null);
                    setError('');
                  }}
                  activeOpacity={0.75}
                >
                  {active && <Text style={styles.categoryCheck}>✓</Text>}

                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SUB ITEMS */}
        {selectedCategory && (
          <View style={styles.section}>
            <View style={styles.subHeader}>
              <Text style={styles.sectionTitle}>Sub-item</Text>

              <Text style={styles.itemCount}>
                {getSubVarieties().length} item
                {getSubVarieties().length !== 1 ? 's' : ''}
              </Text>
            </View>

            {getSubVarieties().length > 0 ? (
              <View style={styles.subGrid}>
                {getSubVarieties().map((sub: any, index: number) => {
                  const active = selectedSub?.id === sub.id;

                  const stock = Number(sub.stock || 0);

                  const unit = getStockUnitLabel(
                    sub.unit || selectedCategory.unit || '',
                  );

                  return (
                    <TouchableOpacity
                      key={sub.id || index}
                      style={[styles.subCard, active && styles.subCardActive]}
                      onPress={() => {
                        setSelectedSub(sub);
                        setError('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.subCardTop}>
                        <View style={styles.subCardText}>
                          <Text
                            style={[
                              styles.subName,
                              active && styles.subNameActive,
                            ]}
                            numberOfLines={2}
                          >
                            {sub.name}
                          </Text>

                          {!!sub.description && (
                            <Text
                              style={[
                                styles.subDescription,
                                active && styles.subDescriptionActive,
                              ]}
                              numberOfLines={1}
                            >
                              {sub.description}
                            </Text>
                          )}
                        </View>

                        <View
                          style={[
                            styles.selectCircle,
                            active && styles.selectCircleActive,
                          ]}
                        >
                          {active && <Text style={styles.selectCheck}>✓</Text>}
                        </View>
                      </View>

                      <View style={styles.stockRow}>
                        <Text
                          style={[
                            styles.stockLabel,
                            active && styles.stockLabelActive,
                          ]}
                        >
                          Current stock
                        </Text>

                        <Text
                          style={[
                            styles.stockValue,
                            active && styles.stockValueActive,
                          ]}
                        >
                          {Number(stock).toFixed(2).replace(/\.00$/, '')}
                          {''} {unit}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No sub-items</Text>
                <Text style={styles.emptyText}>
                  This category doesn't have any sub-items yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* QUANTITY */}
        {selectedSub && (
          <>
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionTitle}>Quantity received</Text>

                {!!selectedUnit && (
                  <Text style={styles.unitText}>({selectedUnit})</Text>
                )}
              </View>

              <View style={styles.quantityBox}>
                <View style={styles.quantityIcon}>
                  <Text style={styles.quantityIconText}>▱</Text>
                </View>

                <TextInput
                  value={qty}
                  onChangeText={text => {
                    setQty(text.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  placeholder="e.g. 20"
                  placeholderTextColor={COLORS.textFaint}
                  keyboardType="number-pad"
                  style={styles.quantityInput}
                />

                <View style={styles.quantityActions}>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => {
                      const current = Number(qty || 0);

                      if (current > 0) {
                        setQty(String(current - 1));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityBtnText}>−</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => {
                      const current = Number(qty || 0);
                      setQty(String(current + 1));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* NOTE */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionTitle}>Note</Text>
                <Text style={styles.optionalText}>optional</Text>
              </View>

              <TextInput
                value={itemNote}
                onChangeText={text => {
                  setItemNote(text);
                  setError('');
                }}
                placeholder="e.g. supplier name, invoice no."
                placeholderTextColor={COLORS.textFaint}
                style={styles.noteInput}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* ERROR */}
            {!!error && (
              <View style={styles.errorBox}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>

                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ADD TO LIST */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addToCart}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonIcon}>＋</Text>
              <Text style={styles.addButtonText}>Add to list</Text>
            </TouchableOpacity>
          </>
        )}

        {/* EMPTY INITIAL STATE */}
        {!selectedCategory && (
          <View style={styles.selectHint}>
            <View style={styles.selectHintIcon}>
              <Text style={styles.selectHintIconText}>↓</Text>
            </View>

            <Text style={styles.selectHintTitle}>Select a category</Text>

            <Text style={styles.selectHintText}>
              Choose a category above to see its sub-items.
            </Text>
          </View>
        )}

        {/* CONFIRM */}
        {cart.length > 0 && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              saving && styles.confirmButtonDisabled,
            ]}
            onPress={submitAll}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.confirmText}>Confirm all</Text>

                <View style={styles.confirmCount}>
                  <Text style={styles.confirmCountText}>{cart.length}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.cacao,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerIconText: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '600',
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    color: COLORS.cacaoDark,
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  /* CART */

  cartBox: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFC4AA',
    borderRadius: 18,
    marginBottom: 22,
    overflow: 'hidden',
  },

  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAD9C8',
  },

  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cartIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F4E7D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  cartIconText: {
    fontSize: 19,
  },

  cartTitle: {
    color: COLORS.cacaoDark,
    fontSize: 17,
    fontWeight: '800',
  },

  cartSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 1,
  },

  clearText: {
    color: COLORS.cacao,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  cartItems: {
    paddingHorizontal: 14,
  },

  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE0D2',
  },

  cartItemIndicator: {
    width: 4,
    height: 42,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 11,
  },

  cartItemContent: {
    flex: 1,
  },

  cartItemName: {
    color: COLORS.cacaoDark,
    fontSize: 15,
    fontWeight: '800',
  },

  cartItemQuantity: {
    color: COLORS.cacao,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },

  cartMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  cartCategory: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  metaDot: {
    color: COLORS.textFaint,
    marginHorizontal: 5,
  },

  cartNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    flex: 1,
  },

  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  removeText: {
    color: COLORS.danger,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '500',
  },

  /* SECTION */

  section: {
    marginBottom: 19,
  },

  sectionTitle: {
    color: COLORS.cacaoDark,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },

  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },

  categoryScroll: {
    paddingRight: 12,
  },

  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCC2AA',
    backgroundColor: '#FFFDF9',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 17,
    marginRight: 8,
  },

  categoryPillActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },

  categoryCheck: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 7,
  },

  categoryText: {
    color: COLORS.cacaoDark,
    fontSize: 13,
    fontWeight: '600',
  },

  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  /* SUB ITEMS */

  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  subCard: {
    width: '48.5%',
    minHeight: 128,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFCBB8',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    justifyContent: 'space-between',
  },

  subCardActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },

  subCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  subCardText: {
    flex: 1,
    paddingRight: 5,
  },

  subName: {
    color: COLORS.cacaoDark,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },

  subNameActive: {
    color: COLORS.white,
  },

  subDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  subDescriptionActive: {
    color: '#EBD8C6',
  },

  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D6B99C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  selectCircleActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },

  selectCheck: {
    color: COLORS.cacao,
    fontSize: 15,
    fontWeight: '900',
  },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  stockLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  stockLabelActive: {
    color: '#E8D4C0',
  },

  stockValue: {
    color: COLORS.cacao,
    fontSize: 11,
    fontWeight: '800',
  },

  stockValueActive: {
    color: COLORS.white,
  },

  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8C1AB',
    borderRadius: 15,
    padding: 22,
    alignItems: 'center',
    backgroundColor: '#FFFCF8',
  },

  emptyTitle: {
    color: COLORS.cacaoDark,
    fontSize: 14,
    fontWeight: '700',
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  /* QUANTITY */

  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  unitText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 10,
  },

  quantityBox: {
    height: 58,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFCBB8',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
  },

  quantityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4E8DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityIconText: {
    color: COLORS.cacao,
    fontSize: 20,
  },

  quantityInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 12,
    color: COLORS.cacaoDark,
    fontSize: 16,
    fontWeight: '600',
  },

  quantityActions: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 8,
  },

  quantityBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3E9DE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityBtnText: {
    color: COLORS.cacao,
    fontSize: 23,
    fontWeight: '500',
  },

  /* NOTE */

  optionalText: {
    color: COLORS.textFaint,
    fontSize: 11,
    marginLeft: 5,
    marginBottom: 10,
  },

  noteInput: {
    minHeight: 56,
    maxHeight: 85,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFCBB8',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.cacaoDark,
    fontSize: 14,
    textAlignVertical: 'top',
  },

  /* ADD */

  addButton: {
    height: 55,
    borderRadius: 15,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  addButtonIcon: {
    color: COLORS.white,
    fontSize: 25,
    marginRight: 8,
  },

  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  /* ERROR */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  errorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  errorIconText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  /* INITIAL HINT */

  selectHint: {
    backgroundColor: '#FFFDF9',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E1CEBB',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 18,
  },

  selectHintIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E5D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  selectHintIconText: {
    color: COLORS.cacao,
    fontSize: 20,
  },

  selectHintTitle: {
    color: COLORS.cacaoDark,
    fontSize: 14,
    fontWeight: '800',
  },

  selectHintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  /* CONFIRM */

  confirmButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.cacao,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  confirmButtonDisabled: {
    opacity: 0.7,
  },

  confirmText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  confirmCount: {
    minWidth: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
    paddingHorizontal: 7,
  },

  confirmCountText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default Stock;
