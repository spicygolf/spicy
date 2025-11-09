import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";
import type { Href } from "@/ui/Link";
import { Link } from "@/ui/Link";

type Props<ParamList extends ParamListBase = ParamListBase> = {
  home?: Href<ParamList>;
};

export function Back<ParamList extends ParamListBase = ParamListBase>({
  home,
}: Props<ParamList>) {
  const theme = UnistylesRuntime.getTheme();
  const navigation = useNavigation();

  if (home) {
    return (
      <Link href={home}>
        <FontAwesome6
          name="chevron-left"
          size={20}
          color={theme.colors.primary}
          iconStyle="solid"
        />
      </Link>
    );
  }

  return (
    <Pressable onPress={() => navigation.goBack()}>
      <FontAwesome6
        name="chevron-left"
        size={20}
        color={theme.colors.primary}
        iconStyle="solid"
      />
    </Pressable>
  );
}
