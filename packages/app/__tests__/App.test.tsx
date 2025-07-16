/* eslint-disable import/order */
/**
 * @format
 */

import "react-native";

// Note: import explicitly to use the types shipped with jest.
import { it } from "@jest/globals";
// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";
import { App } from "../src/app/App";

it("renders correctly", () => {
  renderer.create(<App />);
});
