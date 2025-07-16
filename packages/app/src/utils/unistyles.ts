import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';

const system = UnistylesRuntime.colorScheme === 'dark' ? 'dark' : 'light';

const light = {
  colors: {
    primary: '#222',
    secondary: '#555',
    background: '#ddd',
    action: '#007AFF',
  },
  // functions, external imports, etc.
  gap: (v: number) => v * 8,
};

const dark = {
  colors: {
    primary: '#ddd',
    secondary: '#999',
    background: '#222',
    action: '#007AFF',
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
