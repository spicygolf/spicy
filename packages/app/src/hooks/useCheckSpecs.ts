import { useAccount } from "jazz-tools/react-native";
import { PlayerAccount } from "spicylib/schema";

export function useCheckSpecs() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: { $each: true },
      },
    },
  });

  const checkSpecs = () => {
    // This function is intentionally empty - it was only used for debugging
    // It can be removed if no longer needed
  };

  return { checkSpecs };
}
