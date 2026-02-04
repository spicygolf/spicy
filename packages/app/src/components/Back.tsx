import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { ParamListBase } from "@react-navigation/native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";
import { UnistylesRuntime } from "react-native-unistyles";
import type { Href } from "@/ui/Link";
import { Link } from "@/ui/Link";

interface BackProps<ParamList extends ParamListBase = ParamListBase> {
  /** Navigate to a specific route using Link (for typed navigation) */
  home?: Href<ParamList>;
  /** Navigate to a specific screen by name (for dynamic navigation) */
  backTo?: string;
}

/**
 * Back button component for navigation.
 *
 * Supports three modes:
 * - Default: calls navigation.goBack()
 * - home prop: uses Link for typed navigation to a specific route
 * - backTo prop: navigates to a screen by name using CommonActions
 */
export function Back<ParamList extends ParamListBase = ParamListBase>({
  home,
  backTo,
}: BackProps<ParamList>): React.ReactElement {
  const theme = UnistylesRuntime.getTheme();
  const navigation = useNavigation();

  const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

  const icon = (
    <FontAwesome6
      name="chevron-left"
      size={20}
      color={theme.colors.primary}
      iconStyle="solid"
    />
  );

  if (home) {
    return (
      <Link href={home} hitSlop={hitSlop}>
        {icon}
      </Link>
    );
  }

  const handlePress = backTo
    ? () => navigation.dispatch(CommonActions.navigate({ name: backTo }))
    : () => navigation.goBack();

  return (
    <Pressable onPress={handlePress} hitSlop={hitSlop} testID="nav-back-button">
      {icon}
    </Pressable>
  );
}
