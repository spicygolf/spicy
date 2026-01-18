import "@/utils/polyfills";
import "@/utils/unistyles";

import { setPasskeyModule } from "jazz-tools/react-native-core";
// Inject passkey module early to avoid dynamic require issues in monorepo/release builds
import { Passkey } from "react-native-passkey";

setPasskeyModule(Passkey);

import { AppRegistry } from "react-native";
import { App } from "@/app/App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
