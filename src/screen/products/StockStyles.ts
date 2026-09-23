import { StyleSheet } from 'react-native';
import { COLORS } from 'theme/Theme';

export const StockStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },

  tabletRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.creamSoft,
  },

  tabletFormColumn: {
    flex: 1.4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  tabletCartColumn: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  tabletCartContent: {
    padding: 16,
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
  emptyCartHint: {
    padding: 30,
    alignItems: 'center',
  },
  emptyCartHintText: {
    color: COLORS.textFaint,
    fontSize: 13,
    textAlign: 'center',
  },
});