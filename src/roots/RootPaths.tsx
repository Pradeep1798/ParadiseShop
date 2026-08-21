import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackScreens, SCREENS } from './RootStack';
import Home from 'screen/Home/Home';

const RootPaths = () => {
  const Stack = createNativeStackNavigator<RootStackScreens>();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={SCREENS.SPLASH}
        component={Home}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name={SCREENS.HOME}
        component={Home}
        options={{headerShown: false}}
      /> */}
    </Stack.Navigator>
  );
};

export default RootPaths;
