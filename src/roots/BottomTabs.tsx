import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from 'screen/Home/Home';
import PriceList from 'screen/priceList/PriceList';
import Notifications from 'screen/notification/notications';
import { TABSCREENS } from './RootStack';

const Tab = createBottomTabNavigator();

const BottomTabs = ({ route, navigation }: any) => {
  const params = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C17A3D',
        tabBarInactiveTintColor: '#9C8768',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E2CFAF' },
      }}
    >
      <Tab.Screen
        name={TABSCREENS.HOME}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      >
        {props => <Home {...props} route={{ ...props.route, params }} />}
      </Tab.Screen>
      <Tab.Screen
        name={TABSCREENS.PRICELIST}
        options={{
          title: 'Price List',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏷️</Text>
          ),
        }}
      >
        {props => <PriceList {...props} route={{ ...props.route, params }} />}
      </Tab.Screen>

      <Tab.Screen
        name={TABSCREENS.NOTIFY}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔔</Text>
          ),
        }}
      >
        {props => (
          <Notifications {...props} route={{ ...props.route, params }} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default BottomTabs;
