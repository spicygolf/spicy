// biome-ignore-all assist/source/organizeImports: order of imports ignored for polyfills

import { Buffer } from "buffer";
if (!globalThis.Buffer) {
  // @ts-ignore - Buffer polyfill assignment
  globalThis.Buffer = Buffer;
}

// @ts-expect-error - @types/readable-stream doesn't have ReadableStream type
import { ReadableStream } from "readable-stream";
// @ts-ignore - ReadableStream check
if (!globalThis.ReadableStream) {
  // @ts-ignore - ReadableStream polyfill assignment
  globalThis.ReadableStream = ReadableStream;
}

import "@azure/core-asynciterator-polyfill";

import "@bacons/text-decoder/install";

import "react-native-get-random-values";
