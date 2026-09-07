import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { getDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const MIN_SPLASH_DURATION = 2000;

const Splash = ({ navigation }: any) => {
  useEffect(() => {
    const check = async () => {
      const start = Date.now();

      try {
        const session = await getDeviceSession();

        const elapsed = Date.now() - start;
        const remaining = MIN_SPLASH_DURATION - elapsed;

        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }

        if (session) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: SCREENS.HOME,
                params: session,
              },
            ],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: SCREENS.SHOP_PICKER,
              },
            ],
          });
        }
      } catch (error) {
        console.log('Splash session error:', error);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: SCREENS.SHOP_PICKER,
            },
          ],
        });
      }
    };

    check();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Image
        source={require('assets/splash_full.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Optional loading indicator */}
      <ActivityIndicator size="small" color="#FBF4EC" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20100A',
  },

  background: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },

  loader: {
    position: 'absolute',
    bottom: 45,
    alignSelf: 'center',
  },
});

export default Splash;