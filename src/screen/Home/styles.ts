import { StyleSheet } from "react-native";
import { COLORS } from "theme/Theme";

export const homeStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  container: {
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 30,
  },

  /* CART */

  cartWrapper: {
    marginBottom: 18,
  },

  /* SECTIONS */

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.cacaoDark,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  /* QUICK SELL */

  quickScroll: {
    paddingRight: 12,
    paddingBottom: 3,
  },

  quickCard: {
    width: 125,
    minHeight: 88,
    backgroundColor: COLORS.cacao,
    borderRadius: 15,
    padding: 11,
    marginRight: 9,
  },

  quickIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  quickIconText: {
    color: COLORS.white,
    fontSize: 20,
    lineHeight: 21,
  },

  quickName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  quickPrice: {
    color: '#EAD8C7',
    fontSize: 10,
    marginTop: 3,
  },

  /* ITEMS */

  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  itemCountBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#F1E4D7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemCountText: {
    color: COLORS.cacao,
    fontSize: 12,
    fontWeight: '800',
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  itemCard: {
    width: '48.5%',
    minHeight: 112,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 12,
    marginBottom: 9,
    justifyContent: 'space-between',
  },

  itemCardActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },

  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  itemInfo: {
    flex: 1,
    paddingRight: 5,
  },

  itemName: {
    color: COLORS.cacaoDark,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },

  itemNameActive: {
    color: COLORS.white,
  },

  itemPrice: {
    color: COLORS.cacao,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  itemPriceActive: {
    color: '#EBD8C6',
  },

  checkCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D5B99D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircleActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },

  checkText: {
    color: COLORS.cacao,
    fontSize: 14,
    fontWeight: '900',
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  stockLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },

  stockLabelActive: {
    color: '#DCC5B0',
  },

  stockValue: {
    color: COLORS.cacaoDark,
    fontSize: 10,
    fontWeight: '800',
  },

  stockValueActive: {
    color: COLORS.white,
  },

  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
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
  },

  /* SELL PANEL */

  sellPanel: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFC9B3',
    borderRadius: 18,
    padding: 15,
    marginBottom: 20,
  },

  sellPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 13,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE0D3',
  },

  sellPanelTitle: {
    color: COLORS.cacaoDark,
    fontSize: 16,
    fontWeight: '800',
  },

  sellPanelSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  sellStockBadge: {
    backgroundColor: '#EDF4EA',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },

  sellStockText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '700',
  },

  fieldLabel: {
    color: COLORS.cacaoDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },

  /* PRESETS */

  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  presetBtn: {
    backgroundColor: '#F5EADF',
    borderWidth: 1,
    borderColor: '#E1CDB9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  presetBtnActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },

  presetBtnCustom: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },

  presetText: {
    color: COLORS.cacao,
    fontSize: 12,
    fontWeight: '700',
  },

  presetTextActive: {
    color: COLORS.white,
  },

  /* QUANTITY */

  quantityControl: {
  flexDirection: 'row',
  alignItems: 'center',
  height: 50,
  backgroundColor: COLORS.white,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  overflow: 'hidden',
  marginTop: 6,
},

quantityButton: {
  width: 52,
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.creamAlt,
},

quantityButtonText: {
  fontSize: 24,
  lineHeight: 28,
  fontWeight: '600',
  color: COLORS.cacao,
},

quantityInput: {
  flex: 1,
  height: '100%',
  paddingHorizontal: 10,
  paddingVertical: 0,
  fontSize: 17,
  fontWeight: '600',
  color: COLORS.cacaoDark,
  backgroundColor: COLORS.white,
  textAlign: 'center',
},

  quantityBox: {
    height: 58,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    overflow: 'hidden',
  },

  quantityInputArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
  },


  quantityUnit: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginRight: 8,
  },

  quantityActions: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 7,
  },


  /* COUNT */

  countHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  countHint: {
    color: COLORS.textFaint,
    fontSize: 10,
    marginTop: 12,
  },

  countBox: {
    height: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButton: {
    width: 45,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButtonText: {
    color: COLORS.cacao,
    fontSize: 23,
  },

  countInput: {
    width: 70,
    height: 45,
    color: COLORS.cacaoDark,
    fontSize: 17,
    fontWeight: '800',
    padding: 0,
  },

  /* AMOUNT */

  amountSummary: {
    backgroundColor: '#F7EEE5',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  amountLabel: {
    color: COLORS.cacaoDark,
    fontSize: 12,
    fontWeight: '700',
  },
amountInput: {
  minWidth: 90,
  fontSize: 20,
  fontWeight: '900',
  color: COLORS.cacao,
  padding: 0,
},
  amountCalculation: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  amountValue: {
    color: COLORS.cacao,
    fontSize: 20,
    fontWeight: '900',
  },

  /* ERROR */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 11,
  },

  errorCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  errorIcon: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  /* ADD BUTTON */

  addBtn: {
    height: 52,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  addBtnIcon: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: '400',
    marginRight: 7,
  },

  addBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  /* PAYMENT */

  paymentSection: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#DFC9B3',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },

  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },

  paymentTotal: {
    color: COLORS.cacao,
    fontSize: 20,
    fontWeight: '900',
  },

  splitBox: {
    backgroundColor: '#F7EEE5',
    borderRadius: 13,
    padding: 12,
    marginTop: 12,
  },

  splitInputGroup: {
    marginBottom: 9,
  },

  splitLabel: {
    color: COLORS.cacaoDark,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },

  splitInput: {
    height: 45,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    color: COLORS.cacaoDark,
    fontSize: 14,
    fontWeight: '600',
  },

  splitErrorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },

  splitOkText: {
    color: COLORS.success,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },

  /* COMPLETE */

  completeButton: {
    minHeight: 61,
    backgroundColor: COLORS.caramel,
    borderRadius: 16,
    marginTop: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  completeButtonDisabled: {
    opacity: 0.7,
  },

  completeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  completeIconText: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: '900',
  },

  completeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  completeSubtext: {
    color: '#DFCABB',
    fontSize: 10,
    marginTop: 2,
  },

  completeAmount: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    marginLeft: 'auto',
  },

  bottomSpace: {
    height: 40,
  },
});