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
    console.log("=== Checking Specs ===");
    console.log("Me loaded?", me?.$isLoaded);

    if (!me?.$isLoaded) {
      console.log("Me not loaded yet");
      console.log("=== End Check ===");
      return;
    }

    console.log("Root loaded?", me.root?.$isLoaded);
    console.log("Specs loaded?", me.root?.specs?.$isLoaded);

    if (me.root?.specs?.$isLoaded) {
      const specs = me.root.specs;
      console.log("Total specs:", specs.length);

      specs.forEach((spec: (typeof specs)[number], index: number) => {
        if (spec?.$isLoaded) {
          console.log(`${index}: ${spec.name} - ${spec.short}`);
        } else {
          console.log(`${index}: Not loaded`);
        }
      });
    } else {
      console.log("Specs not loaded yet");
    }
    console.log("=== End Check ===");
  };

  return { checkSpecs };
}
