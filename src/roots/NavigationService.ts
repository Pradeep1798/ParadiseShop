import * as React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';

type RootNavigationType = NavigationContainerRef<Record<string, object | undefined>>;

export const navigationRef = React.createRef<RootNavigationType>();

export function navigate(name: string, params?: object) {
  navigationRef.current?.navigate(name, params);
}

export function replace(routeName: string, params?: object) {
  navigationRef.current?.resetRoot({
    index: 0,
    routes: [{ name: routeName, params }],
  });
}
