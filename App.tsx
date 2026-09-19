import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from 'roots/NavigationService';
import RootPaths from 'roots/RootPaths';
import { KeyboardProvider } from 'react-native-keyboard-controller';

const App = () => {
  return (
    <KeyboardProvider>
      <NavigationContainer ref={navigationRef}>
        <RootPaths />
      </NavigationContainer>
    </KeyboardProvider>
  );
};

export default App;
