import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

type DrawerMenuItemProps = {
  label: string;
  icon: string;
  screen: string;
  navigation: any;
  state: any;
};

const DrawerMenuItem = ({
  label,
  icon,
  screen,
  navigation,
  state,
}: DrawerMenuItemProps) => {

  const currentRoute = state.routes[state.index];

  const isActive = currentRoute.name === screen;

  return (
    <Pressable
      onPress={() => navigation.navigate(screen)}
      style={({ pressed }) => [
        styles.menuItem,
        isActive && styles.activeMenuItem,
        pressed && styles.pressedMenuItem,
      ]}
    >

      {/* Active indicator */}
      {isActive && (
        <View style={styles.activeIndicator} />
      )}

      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          isActive && styles.activeIconContainer,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? '#5C3620' : '#795548'}
        />
      </View>

      {/* Label */}
      <Text
        style={[
          styles.menuLabel,
          isActive && styles.activeMenuLabel,
        ]}
      >
        {label}
      </Text>

      {/* Arrow for active screen */}
      {isActive && (
        <Ionicons
          name="chevron-forward"
          size={17}
          color="#C17A3D"
        />
      )}

    </Pressable>
  );
};

export default DrawerMenuItem;