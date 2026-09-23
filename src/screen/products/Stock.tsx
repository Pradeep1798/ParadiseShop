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
import { StockStyles as StockStyles } from './StockStyles';

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
        <View style={StockStyles.cartBox}>
          <View style={StockStyles.cartHeader}>
            <View style={StockStyles.cartHeaderLeft}>
              <View style={StockStyles.cartIcon}>
                <Text style={StockStyles.cartIconText}>🛒</Text>
              </View>

              <View>
                <Text style={StockStyles.cartTitle}>To be added</Text>
                <Text style={StockStyles.cartSubtitle}>
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setCart([])} activeOpacity={0.7}>
              <Text style={StockStyles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <View style={StockStyles.cartItems}>
            {cart.map((item, index) => (
              <View key={index} style={StockStyles.cartRow}>
                <View style={StockStyles.cartItemIndicator} />

                <View style={StockStyles.cartItemContent}>
                  <Text style={StockStyles.cartItemName}>{item.subVarietyName}</Text>

                  <Text style={StockStyles.cartItemQuantity}>
                    +{item.quantity}
                    {getStockUnitLabel(item.unit)}
                  </Text>

                  <View style={StockStyles.cartMetaRow}>
                    <Text style={StockStyles.cartCategory}>{item.categoryName}</Text>

                    {!!item.note && (
                      <>
                        <Text style={StockStyles.metaDot}>•</Text>
                        <Text style={StockStyles.cartNote} numberOfLines={1}>
                          {item.note}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={StockStyles.removeBtn}
                  onPress={() => removeFromCart(index)}
                  activeOpacity={0.7}
                >
                  <Text style={StockStyles.removeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {cart.length === 0 && isTablet && (
        <View style={StockStyles.emptyCartHint}>
          <Text style={StockStyles.emptyCartHintText}>
            Add stock items to see them here
          </Text>
        </View>
      )}

      {cart.length > 0 && (
        <TouchableOpacity
          style={[StockStyles.confirmButton, saving && StockStyles.confirmButtonDisabled]}
          onPress={submitAll}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={StockStyles.confirmText}>Confirm all</Text>
              <View style={StockStyles.confirmCount}>
                <Text style={StockStyles.confirmCountText}>{cart.length}</Text>
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
      <View style={StockStyles.section}>
        <Text style={StockStyles.sectionTitle}>Category</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={StockStyles.categoryScroll}
        >
          {categories.map(category => {
            const active = selectedCategory?.id === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  StockStyles.categoryPill,
                  active && StockStyles.categoryPillActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setSelectedSub(null);
                  setError('');
                }}
                activeOpacity={0.75}
              >
                {active && <Text style={StockStyles.categoryCheck}>✓</Text>}
                <Text
                  style={[
                    StockStyles.categoryText,
                    active && StockStyles.categoryTextActive,
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
        <View style={StockStyles.section}>
          <View style={StockStyles.subHeader}>
            <Text style={StockStyles.sectionTitle}>Sub-item</Text>
            <Text style={StockStyles.itemCount}>
              {getSubVarieties().length} item
              {getSubVarieties().length !== 1 ? 's' : ''}
            </Text>
          </View>

          {getSubVarieties().length > 0 ? (
            <View style={StockStyles.subGrid}>
              {getSubVarieties().map((sub: SubVariety, index: number) => {
                const active = selectedSub?.id === sub.id;
                const stock = Number(sub.stock || 0);
                const unit = getStockUnitLabel(
                  sub.unit || selectedCategory.unit || '',
                );

                return (
                  <TouchableOpacity
                    key={sub.id || index}
                    style={[StockStyles.subCard, active && StockStyles.subCardActive]}
                    onPress={() => {
                      setSelectedSub(sub);
                      setError('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={StockStyles.subCardTop}>
                      <View style={StockStyles.subCardText}>
                        <Text
                          style={[
                            StockStyles.subName,
                            active && StockStyles.subNameActive,
                          ]}
                          numberOfLines={2}
                        >
                          {sub.name}
                        </Text>
                        {!!sub.description && (
                          <Text
                            style={[
                              StockStyles.subDescription,
                              active && StockStyles.subDescriptionActive,
                            ]}
                            numberOfLines={1}
                          >
                            {sub.description}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          StockStyles.selectCircle,
                          active && StockStyles.selectCircleActive,
                        ]}
                      >
                        {active && <Text style={StockStyles.selectCheck}>✓</Text>}
                      </View>
                    </View>
                    <View style={StockStyles.stockRow}>
                      <Text
                        style={[
                          StockStyles.stockLabel,
                          active && StockStyles.stockLabelActive,
                        ]}
                      >
                        Current stock
                      </Text>
                      <Text
                        style={[
                          StockStyles.stockValue,
                          active && StockStyles.stockValueActive,
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
            <View style={StockStyles.emptyBox}>
              <Text style={StockStyles.emptyTitle}>No sub-items</Text>
              <Text style={StockStyles.emptyText}>
                This category doesn't have any sub-items yet.
              </Text>
            </View>
          )}
        </View>
      )}

      {selectedSub && (
        <>
          <View style={StockStyles.section}>
            <View style={StockStyles.labelRow}>
              <Text style={StockStyles.sectionTitle}>Quantity received</Text>
              {!!selectedUnit && (
                <Text style={StockStyles.unitText}>({selectedUnit})</Text>
              )}
            </View>
            <View style={StockStyles.quantityBox}>
              <View style={StockStyles.quantityIcon}>
                <Text style={StockStyles.quantityIconText}>▱</Text>
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
                style={StockStyles.quantityInput}
              />
              <View style={StockStyles.quantityActions}>
                <TouchableOpacity
                  style={StockStyles.quantityBtn}
                  onPress={() =>
                    setQty(String(Math.max(0, Number(qty || 0) - 1)))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={StockStyles.quantityBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={StockStyles.quantityBtn}
                  onPress={() => setQty(String(Number(qty || 0) + 1))}
                  activeOpacity={0.7}
                >
                  <Text style={StockStyles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={StockStyles.section}>
            <View style={StockStyles.labelRow}>
              <Text style={StockStyles.sectionTitle}>Note</Text>
              <Text style={StockStyles.optionalText}>optional</Text>
            </View>
            <TextInput
              value={itemNote}
              onChangeText={text => {
                setItemNote(text);
                setError('');
              }}
              placeholder="e.g. supplier name, invoice no."
              placeholderTextColor={COLORS.textFaint}
              style={StockStyles.noteInput}
              multiline
              numberOfLines={2}
            />
          </View>

          {!!error && (
            <View style={StockStyles.errorBox}>
              <View style={StockStyles.errorIcon}>
                <Text style={StockStyles.errorIconText}>!</Text>
              </View>
              <Text style={StockStyles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={StockStyles.addButton}
            onPress={addToCart}
            activeOpacity={0.8}
          >
            <Text style={StockStyles.addButtonIcon}>＋</Text>
            <Text style={StockStyles.addButtonText}>Add to list</Text>
          </TouchableOpacity>
        </>
      )}

      {!selectedCategory && (
        <View style={StockStyles.selectHint}>
          <View style={StockStyles.selectHintIcon}>
            <Text style={StockStyles.selectHintIconText}>↓</Text>
          </View>
          <Text style={StockStyles.selectHintTitle}>Select a category</Text>
          <Text style={StockStyles.selectHintText}>
            Choose a category above to see its sub-items.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <ScreenContainer allowWideContent={isTablet}>
      <View style={isTablet ? StockStyles.tabletRow : undefined}>
        <ScrollView
          style={isTablet ? StockStyles.tabletFormColumn : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={StockStyles.container}
        >
          {/* HEADER */}
          <View style={StockStyles.header}>
            <View style={StockStyles.headerIcon}>
              <Text style={StockStyles.headerIconText}>＋</Text>
            </View>

            <View style={StockStyles.headerTextBox}>
              <Text style={StockStyles.title}>Stock In</Text>
              <Text style={StockStyles.subtitle}>
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
          style={StockStyles.tabletCartColumn}
          contentContainerStyle={StockStyles.tabletCartContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCart()}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};



export default Stock;
