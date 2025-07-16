import { TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from './Text';

type ButtonProps = {
  label: string;
  onPress: () => void;
};

export function Button({ label, onPress }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    padding: 10,
    backgroundColor: theme.colors.action,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}));
