import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { UnistylesRuntime } from "react-native-unistyles";
import type { Href } from "@/ui/Link";
import { Link } from "@/ui/Link";

type Props = { home: Href };

export function Back({ home }: Props) {
  const theme = UnistylesRuntime.getTheme();
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
