import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootPaths from 'roots/RootPaths';
import { navigationRef } from 'roots/NavigationService';

const App = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootPaths />
    </NavigationContainer>
  );
};

export default App;
