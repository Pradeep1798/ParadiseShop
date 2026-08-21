import {NavigationProp} from '@react-navigation/native';

export type RootStackScreens = {
  splash: any;
  home: any;
};

export type StackNavigation = NavigationProp<RootStackScreens>;

export const SCREENS = {
  SPLASH: 'splash',
  HOME: 'home',
} as const;
