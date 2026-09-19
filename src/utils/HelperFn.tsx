import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'device_session';

interface DeviceSession {
  shopId: string;
  shopName: string;
  staffName: string;
  role: string;
}

export async function getDeviceSession(): Promise<DeviceSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setDeviceSession(session: DeviceSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearDeviceSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// Central place for "how do we interpret this item's unit" logic,
// so Stock In / Sell / Reports all agree on the same rules.

export function normalizeUnit(unit: string): string {
  return String(unit || '')
    .trim()
    .toLowerCase();
}

export function getStockUnitLabel(baseUnit: string): string {
  const unit = normalizeUnit(baseUnit);

  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l' || unit === 'L') return 'L';
  if (unit === 'pcs' || unit === 'piece' || unit === 'pieces') return 'pcs';

  console.warn('Unexpected unit value:', baseUnit);
  return baseUnit || 'pcs';
}

export function isCountBased(baseUnit: string): boolean {
  return baseUnit === 'pcs';
}

export function roundStock(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function computeStockDelta(
  baseUnit: string,
  enteredQty: number,
): number {
  const delta = isCountBased(baseUnit) ? enteredQty : enteredQty / 1000;

  return roundStock(delta);
}

// Converts an entered quantity into a price, given the item's rate.
// For weight/volume items, `rate` is price per 1000 units (per kg/litre).
// For count items, `rate` is price per single unit (per box/piece).
export function computeAmount(
  baseUnit: string,
  enteredQty: number,
  rate: number,
): number {
  return isCountBased(baseUnit)
    ? enteredQty * rate
    : (enteredQty / 1000) * rate;
}

// Label for the quantity *entry* field (grams/ml/box), as opposed to
// getStockUnitLabel which is for the *stock display* (kg/L/box).
export function getQuantityUnitLabel(baseUnit: string): string {
  const unit = normalizeUnit(baseUnit);

  if (unit === 'g' || unit === 'kg') return 'g';
  if (unit === 'ml' || unit === 'l' || unit === 'L' || unit === 'liter')
    return 'ml';
  if (unit === 'pcs' || unit === 'piece' || unit === 'pieces') return 'pcs';

  return 'pcs';
}

export function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyPlain(amount: number): string {
  return `Rs.${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}