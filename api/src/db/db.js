import { Database } from 'arangojs';
import customenv from 'custom-env';
customenv.env();

const { DB_SCHEME, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

const url = `${DB_SCHEME}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}`;

const db = new Database({
  url: url,
  databaseName: DB_NAME,
});
db.useDatabase(DB_NAME);

export { db };
