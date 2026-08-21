import { NavigationProp } from '@react-navigation/native';
import ShopPicker from 'screen/shopPicker/ShopPicker';

export type RootStackScreens = {
  splash: any;
  home: any;
  ShopPicker: any;
  Pin: any;
  Staff: any;
  StockIn: any;
  Sell: any;
  Expense: any;
};

export type StackNavigation = NavigationProp<RootStackScreens>;

export const SCREENS = {
  SPLASH: 'splash',
  HOME: 'home',
  SHOP_PICKER: 'ShopPicker',
  PIN: 'Pin',
  STAFF: 'Staff',
  STOCK_IN: 'StockIn',
  SELL: 'Sell',
  EXPENSE: 'Expense',
} as const;
