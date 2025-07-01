import { accountRoutes } from './routes/account';
import { ghinRoutes } from './routes/ghin';

export const restRoutes = [].concat(accountRoutes, ghinRoutes);
