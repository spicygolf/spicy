import { LogBox } from "react-native";
import DraggableFlatList, {
  type DraggableFlatListProps,
} from "react-native-draggable-flatlist";

// Suppress the findHostInstance_DEPRECATED warning from react-native-draggable-flatlist
// This is a known issue with the library and React Native 0.80+
// The library still works correctly despite the warning
LogBox.ignoreLogs([
  "findHostInstance_DEPRECATED",
  "findHostInstance_DEPRECATED is deprecated in StrictMode",
]);

// Re-export the component with the same props
export function SafeDraggableFlatList<T>(props: DraggableFlatListProps<T>) {
  return <DraggableFlatList {...props} />;
}

// Re-export types for convenience
export type { RenderItemParams } from "react-native-draggable-flatlist";
