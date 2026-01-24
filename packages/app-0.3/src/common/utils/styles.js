import { StyleSheet } from "react-native";

export const shapeStyles = (size, color) => {
  return StyleSheet.create({
    circle: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderColor: color,
      borderRadius: size / 2,
      borderWidth: 1,
      height: size,
      justifyContent: "center",
      paddingRight: 0,
      width: size,
    },
    match: {
      backgroundColor: "transparent",
      height: size,
      justifyContent: "center",
      paddingRight: 2,
    },
    none: {
      alignItems: "center",
      backgroundColor: "transparent",
      height: size,
      justifyContent: "center",
      paddingRight: 0,
      width: size,
    },
    square: {
      alignItems: "center",
      backgroundColor: "transparent",
      borderColor: color,
      borderWidth: 1,
      height: size,
      justifyContent: "center",
      paddingRight: 0,
      width: size,
    },
  });
};
