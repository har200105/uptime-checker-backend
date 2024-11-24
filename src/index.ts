import express, { Express } from 'express';

import MonitorServer from './server';
import { databaseConnection } from './shared/db';

const initializeApp = (): void => {
  const app: Express = express();
  const monitorServer = new MonitorServer(app);
  databaseConnection().then(() => {
    monitorServer.start();
  });
};

initializeApp();