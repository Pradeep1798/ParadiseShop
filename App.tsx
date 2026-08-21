import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from 'roots/NavigationService';
import RootPaths from 'roots/RootPaths';

const App = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootPaths />
    </NavigationContainer>
  );
};

export default App;
