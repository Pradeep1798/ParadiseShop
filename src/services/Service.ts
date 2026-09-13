import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from '@react-native-firebase/firestore';

const db = () => getFirestore();

export async function getShop(shopId: string) {
  const snap = await getDoc(doc(db(), 'shops', shopId));
  return snap.data() as any;
}

export async function getStaffList(shopId: string) {
  const shop = await getShop(shopId);
  return (shop?.staff || []) as { name: string; role: string; password?: string }[];
}

export async function getCategories(shopId: string) {
  const snap = await getDocs(collection(db(), 'shops', shopId, 'categories'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}

export async function updateCategoryStock(shopId: string, categoryId: string, updatedSubVarieties: any[]) {
  await updateDoc(doc(db(), 'shops', shopId, 'categories', categoryId), { subVarieties: updatedSubVarieties });
}

export async function getTransactionsByDateRange(shopId: string, startDate: string, endDate?: string) {
  const constraints = endDate
    ? [where('date', '>=', startDate), where('date', '<=', endDate)]
    : [where('date', '>=', startDate)];
  const snap = await getDocs(query(collection(db(), 'shops', shopId, 'transactions'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}

export async function getTransactionsForDate(shopId: string, date: string) {
  return getTransactionsByDateRange(shopId, date, date);
}

export async function getExpensesByDateRange(shopId: string, startDate: string, endDate?: string) {
  const constraints = endDate
    ? [where('date', '>=', startDate), where('date', '<=', endDate)]
    : [where('date', '>=', startDate)];
  const snap = await getDocs(query(collection(db(), 'shops', shopId, 'expenses'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}

export async function getDailyClosing(shopId: string, date: string) {
  const snap = await getDoc(doc(db(), 'shops', shopId, 'dailyClosings', date));
  return snap.exists() ? (snap.data() as any) : null;
}

export async function getDailyClosingsByRange(shopId: string, startDate: string) {
  const snap = await getDocs(query(collection(db(), 'shops', shopId, 'dailyClosings'), where('date', '>=', startDate)));
  const byDate: Record<string, any> = {};
  snap.docs.forEach((d) => { byDate[d.id] = d.data(); });
  return byDate;
}

export async function addTransaction(shopId: string, data: any) {
  return addDoc(collection(db(), 'shops', shopId, 'transactions'), data);
}

export async function addExpense(shopId: string, data: any) {
  return addDoc(collection(db(), 'shops', shopId, 'expenses'), data);
}

export async function updateTransaction(shopId: string, transactionId: string, data: any) {
  await updateDoc(doc(db(), 'shops', shopId, 'transactions', transactionId), data);
}

export async function addVoidRecord(shopId: string, data: any) {
  return addDoc(collection(db(), 'shops', shopId, 'voids'), data);
}

export async function getVoids(shopId: string) {
  const snap = await getDocs(query(collection(db(), 'shops', shopId, 'voids'), orderBy('timestamp', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
}

export async function getManagementStaff(shopId: string) {
  const staff = await getStaffList(shopId);
  return staff.filter((p) => p.role === 'owner' || p.role === 'manager');
}

