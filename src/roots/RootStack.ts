import { DrawerNavigationProp } from '@react-navigation/drawer';
import { NavigationProp } from '@react-navigation/native';

export type RootStackScreens = {
  splash: any;
  home: any;
  ShopPicker: any;
  Pin: any;
  Staff: any;
};

export const SCREENS = {
  SPLASH: 'splash',
  HOME: 'home',
  SHOP_PICKER: 'ShopPicker',
  PIN: 'Pin',
  STAFF: 'Staff',
} as const;

export type RootBottomScreens = {
  Home: any;
  PriceList: any;
  Notifications: any;
  StockIn: any;
  Sell: any;
  Expense: any;
  DailyReports: any;
  Bills: any;
  Needs: any;
  WeekReports: any;
  Catalogue: any;
  CloseBill: any;
  Attendance: any;
};

export const TABSCREENS = {
  HOME: 'Home',
  PRICELIST: 'PriceList',
  NOTIFY: 'Notifications',
  STOCK_IN: 'StockIn',
  SELL: 'Sell',
  EXPENSE: 'Expense',
  DAILYREPORTS: 'DailyReports',
  BILLS: 'Bills',
  NEEDS: 'Needs',
  WEEKLY_REPORT: 'WeekReports',
  CATALOGUE: 'Catalogue',
  CLOSEBILLS: 'CloseBill',
  ATTENDANCE: 'Attendance',
} as const;

export type StackNavigation = NavigationProp<RootStackScreens>;
export type DrawerNavigation = DrawerNavigationProp<RootBottomScreens>;
