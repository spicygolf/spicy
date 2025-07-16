import { useAccount } from "jazz-tools/react-native";
import { Button } from "react-native";

export function Logout() {
  const { logOut } = useAccount();
  return <Button title="Log Out" onPress={logOut} />;
}
