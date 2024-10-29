import { MMKV } from 'react-native-mmkv';
// @ts-ignore FIXME
import { Database, Doc } from '@fireproof/core';
import fs from 'react-native-fs';

// clear out database
export const clearDb = (dbName: string) => {
  const id = `fp.0.18.${dbName}`; // works for Fireproof v0.18
  const storage = new MMKV({id});
  storage.clearAll();
  const wal = new MMKV({id: 'fp.0.18.wal'});
  wal.clearAll();
  const meta = new MMKV({id: 'fp.0.18.meta'});
  meta.clearAll();
};

// write doc
export const writeDoc = async (doc: Doc, db: Database) => {
  return await db.put(doc);
};

export const readFS = async () => {
  const p = `${fs.DocumentDirectoryPath}/mmkv/`;
  console.log(p);
  const res = await fs.readDir(p);
  for (let i: number = 0; i < res.length; i++) {
    const file = res[i];
    console.log(file.name);
    // const data = await fs.stat(file.path);
    // console.log(data);
  }
};
