import { StyleSheet } from "react-native";
import { COLORS } from "theme/Theme";

export const homeStyles = StyleSheet.create({
  homeScreen: {
    flex: 1,
    backgroundColor: COLORS.creamSoft,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  container: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 30,
  },

  /* CART */

  cartWrapper: {
    marginBottom: 18,
  },

  /* SECTIONS */

  section: {
    marginBottom: 18,
    marginTop: 8,
  },

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: COLORS.cacaoDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  categoryGridScroll: {
    paddingRight: 12,
  },

  categoryGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    height: 106,
  },

  categoryChip: {
    minHeight: 40,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 7,
    marginBottom: 7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C2B1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
    shadowOpacity: 0.1,
  },
  categoryChipText: {
    color: COLORS.cacaoDark,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  /* QUICK SELL */

  quickScroll: {
    paddingRight: 12,
    paddingBottom: 3,
  },

  quickCard: {
    width: 134,
    minHeight: 94,
    backgroundColor: COLORS.cacao,
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    shadowColor: '#3B1E0E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
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
    minHeight: 116,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    shadowColor: '#4E2E1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  itemCardActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
    shadowOpacity: 0.12,
    transform: [{ scale: 1.01 }],
  },

  itemCardLowStock: {
    borderColor: '#F0C5A2',
    backgroundColor: '#FFF8F4',
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
    fontSize: 11,
  },

  stockLabelActive: {
    color: '#DCC5B0',
  },

  stockValue: {
    color: COLORS.cacaoDark,
    fontSize: 11,
    fontWeight: '800',
  },

  stockValueActive: {
    color: COLORS.white,
  },

  stockValueLowStock: {
    color: '#B65F2F',
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
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#DFC9B3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#6E4730',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
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
    backgroundColor: COLORS.successSoft,
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
    backgroundColor: COLORS.panelMuted,
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
    backgroundColor: COLORS.panelAlt,
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
    height: 54,
    backgroundColor: COLORS.success,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2F6B3F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: COLORS.panel,
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
    backgroundColor: COLORS.panelAlt,
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
    minHeight: 62,
    backgroundColor: COLORS.caramel,
    borderRadius: 16,
    marginTop: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7B4D29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
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
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 'auto',
  },

  bottomSpace: {
    height: 40,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: 'rgba(43, 22, 12, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  celebrationCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF9F2',
    borderRadius: 26,

    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E6D2BF',

    shadowColor: '#3B1D0E',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  recordBadge: {
    backgroundColor: COLORS.cacao,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 18,
  },

  recordBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  trophyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E0C8',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#E2C19F',
  },

  trophyIcon: {
    fontSize: 32,
  },

  celebrationTitle: {
    color: COLORS.cacaoDark,
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },

  celebrationSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
  },
  amountBox: {
    width: '100%',
    backgroundColor: '#F4E5D5',

    borderRadius: 15,

    paddingVertical: 13,
    paddingHorizontal: 10,

    alignItems: 'center',

    marginTop: 17,

    borderWidth: 1,
    borderColor: '#E6CEB7',
  },

  amountLabelAni: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  celebrationAmount: {
    color: COLORS.caramel,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },

  celebrationMessage: {
    color: COLORS.cacao,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
  },

  celebrationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '72%',
    marginTop: 14,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DEC8B2',
  },

  chocolateMark: {
    fontSize: 13,
    marginHorizontal: 8,
  },
  itemCardTablet: {
    width: '31.8%',
    minHeight: 132, // ~14% taller than phone's 116
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
    shadowColor: '#4E2E1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },
  quickCardTablet: {
    width: 150,
    minHeight: 106, // ~13% taller than phone's 94
    backgroundColor: COLORS.cacao,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    shadowColor: '#3B1E0E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  tabletRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.creamSoft,
  },
  tabletLeftCol: {
    flex: 1.4,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tabletRightCol: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  tabletRightColContent: {
    padding: 16,
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
  completeButtonTablet: {
  minHeight: 74, // taller than phone's 62
  borderRadius: 18,
},
});