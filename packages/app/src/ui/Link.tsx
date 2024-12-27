import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export type Href = { name: string; params?: Record<string, unknown> };

type Props = {
  href: Href;
  children: React.ReactNode;
};

export function Link({ href, children }: Props) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
        navigation.navigate(href as never);
      }}>
      {children}
    </Pressable>
  );
}
