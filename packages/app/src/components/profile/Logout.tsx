import { useLogOut } from "jazz-tools/react-native";
import { Button } from "react-native";
import { betterAuthClient } from "@/lib/auth-client";

export function Logout() {
  const logOut = useLogOut();

  const handleLogout = async () => {
    await betterAuthClient.signOut();
    logOut();
  };

  return <Button title="Log Out" onPress={handleLogout} />;
}
