import { NavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackScreens = {
  splash: any;
  home: any;
  ShopPicker: any;
  Pin: any;
  Staff: any;
  StockIn: any;
  Sell: any;
  Expense: any;
  DailyReports: any;
  Bills: any;
  Needs: any;
  WeekReports: any;
};

export const SCREENS = {
  SPLASH: 'splash',
  HOME: 'home',
  SHOP_PICKER: 'ShopPicker',
  PIN: 'Pin',
  STAFF: 'Staff',
  STOCK_IN: 'StockIn',
  SELL: 'Sell',
  EXPENSE: 'Expense',
  DAILYREPORTS: 'DailyReports',
  BILLS: 'Bills',
  NEEDS: 'Needs',
  WEEKLY_REPORT: 'WeekReports',
} as const;

export type RootBottomScreens = {
  Home: any;
  PriceList: any;
};

export const TABSCREENS = {
  HOME: 'Home',
  PRICELIST: 'PriceList',
} as const;

export type StackNavigation = NavigationProp<RootStackScreens>;
export type BottomNavigation = BottomTabNavigationProp<RootBottomScreens>;
