// biome-ignore-all assist/source/organizeImports: order of imports ignored for polyfills
import { Buffer } from "buffer";
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

// @ts-expect-error - @types/readable-stream doesn't have ReadableStream type
import { ReadableStream } from "readable-stream";
if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream;
}

import "@azure/core-asynciterator-polyfill";

import "react-native-get-random-values";

// react-native-fast-encoder polyfill - provides both TextEncoder and TextDecoder
import FastTextEncoder from "react-native-fast-encoder";

// Add encodeInto method which the fast encoder doesn't provide
// @ts-expect-error encodeInto is being added here
if (!FastTextEncoder.prototype.encodeInto) {
  // @ts-expect-error encodeInto is being added here
  FastTextEncoder.prototype.encodeInto = function (
    source: string,
    destination: Uint8Array,
  ) {
    const encoded = this.encode(source);
    const writeLength = Math.min(encoded.length, destination.length);
    for (let i = 0; i < writeLength; i++) {
      destination[i] = encoded[i];
    }
    return { read: source.length, written: writeLength };
  };
}
// @ts-expect-error polyfills, amirite?
globalThis.TextEncoder = FastTextEncoder;
// @ts-expect-error polyfills, amirite?
globalThis.TextDecoder = FastTextEncoder;
