import { ApolloServer, PubSub } from 'apollo-server-hapi';

import config from './config';
import { server as hapiServer } from '@hapi/hapi';
import jwt2Hapi from 'hapi-auth-jwt2';
import { restRoutes } from './rest';
import { schema } from './graphql/schema';
import { validate } from './auth';

const {
  crypto: { privateKey },
} = config;

export const pubsub = new PubSub();

const {
  APP_HOST: host,
  APP_PORT: port,
  API_VERSION: api,
  GRAPHQL_ENDPOINT: graphql,
  SUBSCRIPTION_ENDPOINT: subscription,
} = process.env;

const StartServer = async () => {
  const graphqlPath = `/${api}/${graphql}`;
  const subscriptionPath = `/${api}/${subscription}`;

  // Apollo server
  const apolloServer = new ApolloServer({
    ...schema,
    subscriptions: {
      path: subscriptionPath,
      onConnect: (connectionParams, webSocket, context) => {
        console.log('subscription connect');
        //console.log('connectionParams', connectionParams);
      },
      onOperation: (message, params, webSocket) => {
        console.log('subscription operation', message, params);
      },
      onDisconnect: (webSocket, context) => {
        console.log('subscription disconnect');
      },
    },
  });

  // Hapi server
  const app = new hapiServer({
    host,
    port,
  });

  // Hapi auth
  await app.register(jwt2Hapi);
  app.auth.strategy('jwt', 'jwt', {
    key: privateKey,
    validate: validate,
    verifyOptions: { algorithms: ['HS256'] },
  });
  app.auth.default('jwt');

  await app.route(restRoutes);

  const graphqlRoute = {
    auth: false,
    cors: true,
  };

  // add Apollo Server stuffs into Hapi
  await apolloServer.applyMiddleware({
    app,
    path: graphqlPath,
    route: graphqlRoute,
  });

  apolloServer.installSubscriptionHandlers(app.listener);

  // start up Hapi
  await app.start();

  console.log(
    `Server        ready at: http://${host}:${port}${apolloServer.graphqlPath}`,
  );
  console.log(
    `Subscriptions ready at: http://${host}:${port}${apolloServer.subscriptionsPath}`,
  );
}

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

StartServer().catch((error) => console.log(error));

export default {
  pubsub,
};
