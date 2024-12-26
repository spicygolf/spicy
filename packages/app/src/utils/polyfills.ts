// @ts-expect-error - @types/react-native doesn't cover this file
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// import 'react-native-polyfill-globals/auto';

import { Buffer } from 'buffer';
polyfillGlobal('Buffer', () => Buffer);

// @ts-expect-error - @types/readable-stream doesn't have ReadableStream type
import { ReadableStream } from 'readable-stream';
polyfillGlobal('ReadableStream', () => ReadableStream);

import '@azure/core-asynciterator-polyfill';

import '@bacons/text-decoder/install';

import 'react-native-get-random-values';
