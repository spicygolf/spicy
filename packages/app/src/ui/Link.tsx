import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useLinkTo, useNavigation } from '@react-navigation/native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';

type HrefName<ParamList extends ParamListBase> = {
  [RouteName in keyof ParamList]: {
    name: RouteName;
    path?: never;
    params?: ParamList[RouteName];
  };
}[keyof ParamList];

type HrefPath = {
  path: string;
  name?: never;
  params?: Record<string, unknown>;
};

export type Href<ParamList extends ParamListBase> = HrefName<ParamList> | HrefPath;

type Props<ParamList extends ParamListBase> = {
  href: Href<ParamList>;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Link<ParamList extends ParamListBase>({ href, children, style }: Props<ParamList>) {
  const navigation = useNavigation<NavigationProp<ParamList>>();
  const linkTo = useLinkTo();

  const onPressIn = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    if (!href.name && !href.path) {
      console.warn('Link.tsx: href.name or href.path is required');
      return;
    }
    // use screen name
    if (href.name) {
      // The `as any` is a workaround for a TypeScript limitation where it can't
      // guarantee that `href.name` and `href.params` match, even though our
      // `HrefName` type enforces it.
      navigation.navigate(href.name as any, href.params as any);
    }
    // use path
    if (href.path) {
      linkTo(href.path);
    }
  };

  return (
    <Pressable onPressIn={onPressIn} style={style}>
      {children}
    </Pressable>
  );
}
