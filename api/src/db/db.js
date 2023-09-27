import { Database } from 'arangojs';

const { DB_SCHEME, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

const url = `${DB_SCHEME}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}`;

export const db = new Database({
  url: url,
  databaseName: DB_NAME,
  auth: {
    username: DB_USER,
    password: DB_PASS,
  },
});
