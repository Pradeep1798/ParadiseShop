export type PaymentMethod = 'cash' | 'gpay' | 'split';

export type TransactionType = 'sale' | 'return' | 'stock_in';

export interface StaffMember {
  name: string;
  role: string;
  password?: string;
}

export interface SubVariety {
  id: string;
  name: string;
  unit: string;
  pricePerKg: number;
  stock: number;
  lowStockThreshold: number;
  presetAmounts: number[];
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  unit?: string;
  subVarieties: SubVariety[];
}

export interface CartItem {
  categoryId: string;
  categoryName: string;
  subVarietyId: string;
  subVarietyName: string;
  quantity: number;
  unit: string;
  pieceInfo?: string | null;
  billAmount: number;
  discount?: number;
  finalAmount?: number;
  cashPortion?: number;
  gpayPortion?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  billId?: string;
  originalTransactionId?: string;
  date: string;
  timestamp: number;
  staffName: string;
  categoryId: string;
  categoryName: string;
  subVarietyId: string;
  subVarietyName: string;
  quantity: number;
  unit: string;
  billAmount?: number;
  discount?: number;
  finalAmount?: number;
  cashPortion?: number;
  gpayPortion?: number;
  paymentMethod?: PaymentMethod;
  refundAmount?: number;
  refundMethod?: PaymentMethod;
  note?: string | null;
  voided?: boolean;
  pieceInfo?: string | null;
}

export type TransactionInput = Omit<Transaction, 'id'>;

export interface Expense {
  id: string;
  date: string;
  timestamp: number;
  description: string;
  amount: number;
  staffName: string;
  paymentMethod: 'cash' | 'gpay';
  addedBy?: string;
  note?: string | null;
}

export type ExpenseInput = Omit<Expense, 'id'>;

export interface DailyClosing {
  date: string;
  closedBy: string;
  closedAt: number;
  calculatedSale: number;
  calculatedCash: number;
  calculatedGpay: number;
  calculatedExpense: number;
  calculatedHand: number;
  excessOrShortage: number;
  finalHand: number;
  note?: string | null;
}

export interface VoidRecord {
  id: string;
  billId: string;
  items: Array<{
    name: string;
    qty: number;
    unit: string;
    amount: number;
  }>;
  originalAmount: number;
  requestedBy: string;
  approvedBy: string;
  reason: string;
  timestamp: number;
  date: string;
}

export interface Shop {
  name?: string;
  staff?: StaffMember[];
  locationUrl?: string;
}

export interface BillItem extends Transaction {
  returnedQty: number;
  netAmount: number;
}

export interface BillRecord {
  billId: string;
  staffName: string;
  paymentMethod: PaymentMethod;
  timestamp: number;
  items: BillItem[];
  total: number;
}

export interface LeaveEntry {
  id: string;
  staffName: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  note?: string | null;
  loggedBy: string;
  timestamp: number;
}

export interface DailySummary {
  sale: number;
  cash: number;
  gpay: number;
  expenseTotal: number;
  calculatedHand: number;
}

export interface ReportHistoryEntry {
  id: number;
  label: string;
  filePath: string;
  generatedAt: number;
}