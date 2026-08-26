import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from 'roots/NavigationService';
import RootPaths from 'roots/RootPaths';
import {
  initNotifications,
  scheduleDailyCloseReminder,
} from 'utils/notification';

const App = () => {
  useEffect(() => {
    initNotifications();
    scheduleDailyCloseReminder(22, 0); // 9:00 PM daily — adjust as you like
  }, []);
  return (
    <NavigationContainer ref={navigationRef}>
      <RootPaths />
    </NavigationContainer>
  );
};

export default App;
