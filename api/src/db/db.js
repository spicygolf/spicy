import { Database } from 'arangojs';

const { DB_SCHEME, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

const url = `${DB_SCHEME}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}`;

const systemDb = new Database({
  url: url
});
const db = systemDb.database(DB_NAME);

export { db };
