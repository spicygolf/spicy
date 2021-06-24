
const env = 'PROD';

let s, b;

switch( env ) {
  case 'PROD':
    s = 'https';                 // prod
    b = 'api.spicy.golf/v2';     // prod
    break;
  case 'DEV':
    s = 'http';                  // dev
    b = 'localhost:3010/v2';     // dev - ios
    // b = '10.0.2.2:3010/v2';     // dev - android
}

export const scheme = s;
export const baseUri = b;
