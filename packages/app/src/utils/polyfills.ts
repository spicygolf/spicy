// biome-ignore-all assist/source/organizeImports: order of imports ignored for polyfills

// Buffer polyfill (may be needed by other dependencies)
import { Buffer } from "buffer";
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

// Jazz polyfills: ReadableStream, AsyncIterator, getRandomValues, TextEncoder/TextDecoder
import "jazz-tools/react-native/polyfills";
