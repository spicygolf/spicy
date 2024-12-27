import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';

const system = UnistylesRuntime.colorScheme === 'dark' ? 'dark' : 'light';

const light = {
  colors: {
    primary: '#111',
    secondary: '#1ff4ff',
    background: '#eee',
  },
  // functions, external imports, etc.
  gap: (v: number) => v * 8,
};

const dark = {
  colors: {
    primary: '#eee',
    secondary: 'pink',
    background: '#111',
  },
  gap: (v: number) => v * 8,
};

export const appThemes = {
  light,
  dark,
};

type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  settings: {
    initialTheme: system,
  },
  themes: appThemes,
});
