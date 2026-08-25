import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { getDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const MIN_SPLASH_DURATION = 2000; // 2 seconds — adjust to taste

const Splash = ({ navigation }: any) => {
  useEffect(() => {
    const check = async () => {
      const start = Date.now();

      const session = await getDeviceSession();

      // Ensure the splash stays visible for at least MIN_SPLASH_DURATION,
      // even if the session check itself finishes almost instantly.
      const elapsed = Date.now() - start;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      if (session) {
        navigation.reset({
          index: 0,
          routes: [{ name: SCREENS.HOME, params: session }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: SCREENS.SHOP_PICKER }] });
      }
    };
    check();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('assets/splash_full.png')}
        style={styles.background}
        resizeMode="cover"
      />
      <ActivityIndicator style={styles.loader} size="large" color="#FBF4EC" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#20100A' },
  background: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },
  loader: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
});

export default Splash;
