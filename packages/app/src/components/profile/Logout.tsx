import { useLogOut } from "jazz-tools/react-native";
import { Button } from "react-native";
import { clearStoredCredentials } from "@/hooks/useJazzCredentials";
import { betterAuthClient } from "@/lib/auth-client";

export function Logout() {
  const logOut = useLogOut();

  const handleLogout = async () => {
    clearStoredCredentials();
    await betterAuthClient.signOut();
    logOut();
  };

  return <Button title="Log Out" onPress={handleLogout} />;
}
