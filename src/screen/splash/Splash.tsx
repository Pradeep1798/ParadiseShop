import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const Splash = ({ navigation }: any) => {
  useEffect(() => {
    const check = async () => {
      const session = await getDeviceSession();
      if (session) {
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.HOME, params: session }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.SHOP_PICKER }],
        });
      }
    };
    check();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7A4A2B" />
    </View>
  );
};

export default Splash;
