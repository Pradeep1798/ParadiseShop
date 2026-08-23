import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackScreens, SCREENS } from './RootStack';
import Home from 'screen/Home/Home';
import ShopPicker from 'screen/shopPicker/ShopPicker';
import Pin from 'screen/shopPicker/Pin';
import Staff from 'screen/shopPicker/Staff';
import Splash from 'screen/splash/Splash';
import sell from 'screen/products/sell';
import expense from 'screen/products/expense';
import Stock from 'screen/products/Stock';
import DailyReports from 'screen/reports/dailyReports';
import Bills from 'screen/products/Bills';
import Needs from 'screen/products/Needs';
import WeeklyReport from 'screen/reports/weeklyreports';

const RootPaths = () => {
  const Stack = createNativeStackNavigator<RootStackScreens>();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={SCREENS.SPLASH}
        component={Splash}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.SHOP_PICKER}
        component={ShopPicker}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.PIN}
        component={Pin}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.STAFF}
        component={Staff}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.HOME}
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.SELL}
        component={sell}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.EXPENSE}
        component={expense}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.STOCK_IN}
        component={Stock}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.DAILYREPORTS}
        component={DailyReports}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.BILLS}
        component={Bills}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.NEEDS}
        component={Needs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.WEEKLY_REPORT}
        component={WeeklyReport}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootPaths;
