import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import { json } from 'body-parser';
import cors from 'cors';

import config from './config';
import { schema } from './graphql/schema';

interface MyContext {
  token?: string;
}

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

  // express server
  const app = express();
  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);


  // Apollo server
  const server = new ApolloServer({
    ...schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    subscriptions: {
      path: subscriptionPath,
      onConnect: (connectionParams, webSocket, context) => {
        console.log('subscription connect', connectionParams, webSocket, context);
      },
      onOperation: (message, params, webSocket) => {
        console.log('subscription operation', message, params, webSocket);
      },
      onDisconnect: (webSocket, context) => {
        console.log('subscription disconnect', webSocket, context);
      },
    },
  });

  // TODO: subscriptions and pubsub
  // // subscriptions
  // server.installSubscriptionHandlers(app.listener);

  // Ensure we wait for our server to start
  await server.start();

  app.use(
    graphqlPath,
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );

  // start express
  await new Promise<void>((resolve) => httpServer.listen({
    host,
    port: parseInt(port, 10),
  }, resolve));

  console.log("🚀 Spicy Golf API 🚀");
  console.log(`Server        ready at: http://${host}:${port}${graphqlPath}`);
  // console.log(`Subscriptions ready at: http://${host}:${port}${subscriptionPath}`);

};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

StartServer().catch((error) => console.log(error));
