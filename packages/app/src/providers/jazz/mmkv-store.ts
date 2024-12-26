import { MMKV } from 'react-native-mmkv';
import { KvStore } from 'jazz-react-native';

const storage = new MMKV({
    id: 'spicygolf.default',
});

export class MMKVStore implements KvStore {
    get(key: string): Promise<string | null> {
        return Promise.resolve(storage.getString(key) || null);
    }

    set(key: string, value: string): Promise<void> {
        storage.set(key, value);
        return Promise.resolve();
    }

    delete(key: string): Promise<void> {
        storage.delete(key);
        return Promise.resolve();
    }

    clearAll(): Promise<void> {
        storage.clearAll();
        return Promise.resolve();
    }
}
