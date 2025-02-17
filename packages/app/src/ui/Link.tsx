import React from 'react';
import { Pressable } from 'react-native';
import { useLinkTo, useNavigation } from '@react-navigation/native';

type HrefName = {
  name: string;
  path?: never;
  params?: Record<string, unknown>;
};

type HrefPath = {
  path: string;
  name?: never;
  params?: Record<string, unknown>;
};

export type Href = HrefName | HrefPath;

type Props = {
  href: Href;
  children: React.ReactNode;
};

export function Link({ href, children }: Props) {
  const navigation = useNavigation();
  const linkTo = useLinkTo();

  const onPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    if (!href.name && !href.path) {
      console.warn('Link.tsx: href.name or href.path is required');
      return;
    }
    // use screen name
    if (href.name) {
      navigation.navigate(href.name);
    }
    // use path
    if (href.path) {
      linkTo(href.path);
    }
  };

  return <Pressable onPress={onPress}>{children}</Pressable>;
}
