import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackScreens, SCREENS } from './RootStack';
import Home from 'screen/Home/Home';
import ShopPicker from 'screen/shopPicker/ShopPicker';
import Pin from 'screen/shopPicker/Pin';
import Staff from 'screen/shopPicker/Staff';
import Splash from 'screen/splash/Splash';

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
    </Stack.Navigator>
  );
};

export default RootPaths;
