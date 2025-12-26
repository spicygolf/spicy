import type { KvStore } from "jazz-tools/react-native";
import { MMKV } from "react-native-mmkv";

// Singleton MMKV instance - exported for use by other modules that need
// persistent storage before Jazz is initialized (e.g., useJazzCredentials)
export const storage = new MMKV({
  id: "spicygolf.default",
});

export class MMKVStore implements KvStore {
  async get(key: string): Promise<string | null> {
    return storage.getString(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    return storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    return storage.delete(key);
  }

  async clearAll(): Promise<void> {
    return storage.clearAll();
  }
}
