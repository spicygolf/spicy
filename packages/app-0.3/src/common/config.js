const env = "DEV";

let s, b;

switch (env) {
  case "PROD":
    s = "https"; // prod
    b = "api.spicy.golf/v3"; // prod
    break;
  case "DEV":
    s = "http"; // dev
    b = "localhost:3010/v3"; // dev - ios
  // b = '10.0.2.2:3010/v3';     // dev - android
}

export const scheme = s;
export const baseUri = b;
