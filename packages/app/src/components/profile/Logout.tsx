import { useLogOut } from "jazz-tools/react-native";
import { Button } from "react-native";
import { clearStoredCredentials } from "@/hooks/useJazzCredentials";
import { betterAuthClient } from "@/lib/auth-client";
import { queryClient } from "@/providers/react-query";

export function Logout() {
  const logOut = useLogOut();

  const handleLogout = async () => {
    // Clear cached Jazz credentials from storage
    clearStoredCredentials();
    // Clear the React Query cache for jazz-credentials
    queryClient.removeQueries({ queryKey: ["jazz-credentials"] });
    // Sign out from BetterAuth
    await betterAuthClient.signOut();
    // Sign out from Jazz - this triggers RootNavigator to show AuthNavigator
    logOut();
  };

  return <Button title="Log Out" onPress={handleLogout} />;
}
