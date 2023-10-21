import { Router } from 'express';
import { pathParser } from '../lib/path';
import { yellow } from '../lib/colors';
import { processMessage } from './processMessage';

export const getRoutes = async () => {
  const router = Router();

  router.ws('', async (ws, req) => {
    const path = pathParser(req.path);
    console.log(`${yellow(path)} client connected.`);
    ws.on('message', async (msg: any) => {
      await processMessage(ws, { message: msg, path, query: req.query });
    });
  });

  return router;
};
