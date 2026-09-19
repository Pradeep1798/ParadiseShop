import { StyleSheet } from "react-native";
import { COLORS } from "theme/Theme";

export const BillStyles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  subtitle: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateNavArrow: {
    fontSize: 25,
    lineHeight: 28,
    color: COLORS.caramel,
    fontWeight: '600',
  },

  dateNavArrowDisabled: {
    color: COLORS.border,
  },

  dateNavLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.cacaoDark,
    minWidth: 150,
    textAlign: 'center',
  },

  filterIconBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  filterIconText: {
    fontSize: 12.5,
    color: COLORS.cacao,
    fontWeight: '600',
  },

  filterPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  filterSectionGap: {
    height: 12,
  },

  applyBtn: {
    marginTop: 14,
    backgroundColor: COLORS.caramel,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  applyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DD',
  },

  itemText: {
    flex: 1,
    paddingRight: 12,
    fontSize: 12.8,
    fontWeight: '600',
    color: COLORS.cacaoDark,
    lineHeight: 18,
  },

  itemAmount: {
    minWidth: 75,
    textAlign: 'right',
    fontSize: 13.2,
    fontWeight: '700',
    color: COLORS.cacao,
  },

  discountText: {
    color: '#A33D5B',
    fontWeight: '600',
  },

  excessText: {
    color: COLORS.success,
    fontWeight: '600',
  },

  noteText: {
    fontSize: 11.5,
    color: '#806452',
    fontStyle: 'italic',
    backgroundColor: COLORS.panelSoft,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 7,
    marginBottom: 5,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8D8C7',
  },

  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },

  staffName: {
    flexShrink: 1,
    fontSize: 11,
    color: '#9A806C',
    fontWeight: '500',
  },

  amount: {
    minWidth: 90,
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.caramel,
    letterSpacing: 0.2,
  },

  paymentEditRow: {
    flexDirection: 'row',
    gap: 6,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    minWidth: 52,
    alignItems: 'center',
  },

  badgeCash: {
    backgroundColor: COLORS.successBg,
  },

  badgeGpay: {
    backgroundColor: COLORS.gpayBg,
  },

  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  badgeTextCash: {
    color: '#52734E',
  },

  badgeTextGpay: {
    color: '#3A6EA5',
  },

  badgeTextSplit: {
    color: '#C21858',
  },

  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  printLink: {
    color: COLORS.cacao,
    fontSize: 11,
    textDecorationLine: 'underline',
  },

  paymentBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  editIcon: {
    fontSize: 11,
    color: '#8B6B56',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },

  modalMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },

  input: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },

  paymentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },

  paymentBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },

  paymentBtnActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },

  error: {
    color: COLORS.danger,
    marginTop: 10,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3E6D5',
  },

  cancelBtnText: {
    color: COLORS.cacao,
    fontWeight: '600',
  },

  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.danger,
  },

  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 40,
  },
  voidLink: {
    color: '#9C3654',
    fontSize: 11,
    marginTop: 8,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  voidedCard: { opacity: 0.6, borderColor: COLORS.danger },
  voidedBadge: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 6,
  },
  voidButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E4B8C3',
    backgroundColor: COLORS.dangerSoft,
  },

  voidButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9C3654',
  },
  printButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  printButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.cacao,
  },
});