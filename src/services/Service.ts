import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
} from '@react-native-firebase/firestore';
import {
  Category,
  DailyClosing,
  Expense,
  ExpenseInput,
  Shop,
  StaffMember,
  SubVariety,
  Transaction,
  TransactionInput,
  VoidRecord,
} from 'types/Domain';

const db = () => getFirestore();

export async function getShop(shopId: string) {
  const snap = await getDoc(doc(db(), 'shops', shopId));
  return snap.exists() ? (snap.data() as Shop) : null;
}

export async function getStaffList(shopId: string) {
  const shop = await getShop(shopId);
  return shop?.staff || [];
}

export async function getCategories(shopId: string): Promise<Category[]> {
  const snap = await getDocs(collection(db(), 'shops', shopId, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
}

export async function updateCategoryStock(
  shopId: string,
  categoryId: string,
  updatedSubVarieties: SubVariety[],
) {
  await updateDoc(doc(db(), 'shops', shopId, 'categories', categoryId), {
    subVarieties: updatedSubVarieties,
  });
}

export async function getTransactionsByDateRange(
  shopId: string,
  startDate: string,
  endDate?: string,
): Promise<Transaction[]> {
  const constraints = endDate
    ? [where('date', '>=', startDate), where('date', '<=', endDate)]
    : [where('date', '>=', startDate)];
  const snap = await getDocs(
    query(collection(db(), 'shops', shopId, 'transactions'), ...constraints),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
}

export async function getTransactionsForDate(shopId: string, date: string) {
  return getTransactionsByDateRange(shopId, date, date);
}

export async function getExpensesByDateRange(
  shopId: string,
  startDate: string,
  endDate?: string,
): Promise<Expense[]> {
  const constraints = endDate
    ? [where('date', '>=', startDate), where('date', '<=', endDate)]
    : [where('date', '>=', startDate)];
  const snap = await getDocs(
    query(collection(db(), 'shops', shopId, 'expenses'), ...constraints),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
}

export async function getDailyClosing(
  shopId: string,
  date: string,
): Promise<DailyClosing | null> {
  const snap = await getDoc(doc(db(), 'shops', shopId, 'dailyClosings', date));
  return snap.exists() ? (snap.data() as DailyClosing) : null;
}

export async function getDailyClosingsByRange(
  shopId: string,
  startDate: string,
): Promise<Record<string, DailyClosing>> {
  const snap = await getDocs(
    query(
      collection(db(), 'shops', shopId, 'dailyClosings'),
      where('date', '>=', startDate),
    ),
  );
  const byDate: Record<string, DailyClosing> = {};
  snap.docs.forEach(d => {
    byDate[d.id] = d.data() as DailyClosing;
  });
  return byDate;
}

export async function addTransaction(shopId: string, data: TransactionInput) {
  return addDoc(collection(db(), 'shops', shopId, 'transactions'), data);
}

export async function addExpense(shopId: string, data: ExpenseInput) {
  return addDoc(collection(db(), 'shops', shopId, 'expenses'), data);
}

export async function updateTransaction(
  shopId: string,
  transactionId: string,
  data: Partial<TransactionInput>,
) {
  await updateDoc(
    doc(db(), 'shops', shopId, 'transactions', transactionId),
    data,
  );
}

export async function addVoidRecord(
  shopId: string,
  data: Omit<VoidRecord, 'id'>,
) {
  return addDoc(collection(db(), 'shops', shopId, 'voids'), data);
}

export async function getVoids(shopId: string) {
  const snap = await getDocs(
    query(
      collection(db(), 'shops', shopId, 'voids'),
      orderBy('timestamp', 'desc'),
    ),
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as VoidRecord));
}

export async function getManagementStaff(shopId: string) {
  const staff = await getStaffList(shopId);
  return staff.filter(p => p.role === 'owner' || p.role === 'manager');
}

export async function copyShopCatalogue(fromShopId: string, toShopId: string) {
  const sourceCategories = await getCategories(fromShopId);

  for (const cat of sourceCategories) {
    const copiedSubVarieties = (cat.subVarieties || []).map(
      (sv: SubVariety) => ({
        ...sv,
        stock: 0, // start fresh — Shop B's real stock isn't Shop A's
      }),
    );

    await setDoc(doc(db(), 'shops', toShopId, 'categories', cat.id), {
      name: cat.name,
      subVarieties: copiedSubVarieties,
    });
  }

  return sourceCategories.length; // how many categories were copied
}

export async function getSalesRecord(shopId: string, monthKey: string) {
  const snap = await getDoc(
    doc(db(), 'shops', shopId, 'meta', `salesRecord_${monthKey}`),
  );
  return snap.exists()
    ? (snap.data() as { amount: number; date: string })
    : null;
}

export async function updateSalesRecord(
  shopId: string,
  monthKey: string,
  amount: number,
  date: string,
) {
  await setDoc(doc(db(), 'shops', shopId, 'meta', `salesRecord_${monthKey}`), {
    amount,
    date,
  });
}
