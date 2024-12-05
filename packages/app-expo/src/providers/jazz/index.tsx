import { createJazzRNApp } from "jazz-react-native";
import { PlayerAccount } from "@/schema/accounts";

export const Jazz = createJazzRNApp({ AccountSchema: PlayerAccount });
export const { useAccount, useCoState, useAcceptInvite } = Jazz;
