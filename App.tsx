import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from 'roots/NavigationService';
import RootPaths from 'roots/RootPaths';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { autoConnectSavedPrinter } from 'utils/Printer';

const App = () => {
  useEffect(() => {
    autoConnectSavedPrinter()
      .then(mac => {
        if (mac) {
          console.log(`[Printer] Auto-connected to ${mac}`);
        }
      })
      .catch(err => {
        console.warn('[Printer] Auto-connect failed:', err);
      });
  }, []);

  return (
    <KeyboardProvider>
      <NavigationContainer ref={navigationRef}>
        <RootPaths />
      </NavigationContainer>
    </KeyboardProvider>
  );
};

export default App;
