import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface GameNavProps {
  backTo?: string;
  showBack?: boolean;
  showScore?: boolean;
  title: string;
}

export function GameNav(props: GameNavProps) {
  const { backTo, showBack, showScore: _, title } = props;
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  const back = backTo
    ? () => navigation.dispatch(CommonActions.navigate({ name: backTo }))
    : () => navigation.goBack();

  const left = showBack ? (
    <TouchableOpacity onPress={() => back()}>
      <FontAwesome6
        name="chevron-left"
        size={20}
        color={theme.colors.primary}
        iconStyle="solid"
      />
    </TouchableOpacity>
  ) : (
    <Text />
  );

  // const right = showScore ? (
  //   <TouchableOpacity onPress={() => navigation.navigate('Score', { game, scores })}>
  //     <Icon name="lead-pencil" size={30} color="#666" />
  //   </TouchableOpacity>
  // ) : (
  //   <Text />
  // );
  const right = <Text />;

  return (
    <View style={styles.container}>
      <View style={styles.GameNav}>
        <View style={styles.left}>{left}</View>
        <View style={styles.middle}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  GameNav: {
    flexDirection: "row",
    padding: theme.gap(1),
  },
  container: {
    backgroundColor: theme.colors.background,
  },
  left: {
    flex: 1,
    justifyContent: "center",
  },
  middle: {
    flex: 5,
    justifyContent: "center",
  },
  right: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: theme.colors.primary,
  },
}));
