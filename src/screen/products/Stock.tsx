import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
import { Category, SubVariety } from 'types/Domain';
import { StockStyles as styles } from './StockStyles';

interface StockCartItem {
  categoryId: string;
  categoryName: string;
  subVarietyId: string;
  subVarietyName: string;
  quantity: number;
  unit: string;
  note: string;
}

const Stock = ({
  route,
  navigation,
}: {
  route: { params: { shopId: string; staffName: string } };
  navigation: { navigate: (screen: string) => void };
}) => {
  const { shopId, staffName } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedSub, setSelectedSub] = useState<SubVariety | null>(null);

  const [qty, setQty] = useState('');
  const [itemNote, setItemNote] = useState('');

  const [cart, setCart] = useState<StockCartItem[]>([]);
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
      const grouped: Record<string, StockCartItem[]> = {};

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
            (sub: SubVariety) => sub.id === item.subVarietyId,
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

  const renderCart = () => (
    <>
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
                  <Text style={styles.cartItemName}>{item.subVarietyName}</Text>

                  <Text style={styles.cartItemQuantity}>
                    +{item.quantity}
                    {getStockUnitLabel(item.unit)}
                  </Text>

                  <View style={styles.cartMetaRow}>
                    <Text style={styles.cartCategory}>{item.categoryName}</Text>

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

      {cart.length === 0 && isTablet && (
        <View style={styles.emptyCartHint}>
          <Text style={styles.emptyCartHintText}>
            Add stock items to see them here
          </Text>
        </View>
      )}

      {cart.length > 0 && (
        <TouchableOpacity
          style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
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
    </>
  );

  const renderStockForm = () => (
    <>
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
              {getSubVarieties().map((sub: SubVariety, index: number) => {
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
                        {Number(stock).toFixed(2).replace(/\.00$/, '')} {unit}
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
                  onPress={() =>
                    setQty(String(Math.max(0, Number(qty || 0) - 1)))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQty(String(Number(qty || 0) + 1))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

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

          {!!error && (
            <View style={styles.errorBox}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
    </>
  );

  return (
    <ScreenContainer>
      <View style={isTablet ? styles.tabletRow : undefined}>
        <ScrollView
          style={isTablet ? styles.tabletFormColumn : undefined}
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
              <Text style={styles.subtitle}>
                Add new stock to your inventory
              </Text>
            </View>
          </View>

          {renderStockForm()}

          {/* CONFIRM */}
          {!isTablet && renderCart()}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
      {isTablet && (
        <ScrollView
          style={styles.tabletCartColumn}
          contentContainerStyle={styles.tabletCartContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCart()}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};



export default Stock;
