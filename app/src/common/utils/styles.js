import { StyleSheet } from 'react-native';

export const shapeStyles = (size, color) => {
  return StyleSheet.create({
    circle: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'transparent',
      borderColor: color,
      borderWidth: 1,
      paddingRight: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    square: {
      width: size,
      height: size,
      backgroundColor: 'transparent',
      borderColor: color,
      borderWidth: 1,
      paddingRight: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    none: {
      width: size,
      height: size,
      backgroundColor: 'transparent',
      paddingRight: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    match: {
      height: size,
      backgroundColor: 'transparent',
      paddingRight: 2,
      justifyContent: 'center',
    },
  });
};
