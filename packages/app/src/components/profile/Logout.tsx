import { useLogOut } from "jazz-tools/react-native";
import { Button } from "react-native";
import { clearAllAuthData } from "@/hooks/useJazzCredentials";
import { queryClient } from "@/providers/react-query";

export function Logout() {
  const logOut = useLogOut();

  const handleLogout = async () => {
    // Clear all local auth data (Jazz credentials + auth secret)
    clearAllAuthData();
    // Clear the React Query cache for jazz-credentials
    queryClient.removeQueries({ queryKey: ["jazz-credentials"] });
    // Sign out from Jazz - this triggers RootNavigator to show AuthNavigator
    logOut();
  };

  return <Button title="Log Out" onPress={handleLogout} />;
}
