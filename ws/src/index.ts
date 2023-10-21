import express, { Request, Response, NextFunction }  from 'express';
import expressWs from 'express-ws';
const app = express();
expressWs(app);

import { getRoutes } from './api/routes';
import { init } from './lib/asyncapi';

const start = async () => {

  const port = '3000';

  //you have access to parsed AsyncAPI document in the runtime with asyncapi.get()
  await init();

  const routes = await getRoutes();
  app.use(routes);

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.status(404).send('Error: path not found');
    next();
  });

  app.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
    console.error(err);
    next();
  });

  app.listen(port);
  console.info(`Listening on port ${port}`);
};

start();
