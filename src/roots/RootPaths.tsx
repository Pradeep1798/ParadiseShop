import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  RootBottomScreens,
  RootStackScreens,
  SCREENS,
  TABSCREENS,
} from './RootStack';
import Home from 'screen/Home/Home';
import ShopPicker from 'screen/shopPicker/ShopPicker';
import Staff from 'screen/shopPicker/Staff';
import Splash from 'screen/splash/Splash';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Catalogue from 'screen/catalogue/Catalogue';
import DrawerNav from './DrawerTabs';

const RootPaths = () => {
  const Stack = createNativeStackNavigator<RootStackScreens>();
  const Tab = createBottomTabNavigator<RootBottomScreens>();
  return (
    <Stack.Navigator initialRouteName={SCREENS.SPLASH}>
      <Stack.Screen
        name={SCREENS.SPLASH}
        component={Splash}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.HOME}
        component={DrawerNav}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name={SCREENS.SHOP_PICKER}
        component={ShopPicker}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.STAFF}
        component={Staff}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootPaths;
