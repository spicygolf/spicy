import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import jwt from 'jsonwebtoken';
import http from 'http';
import { json } from 'body-parser';
import cors from 'cors';
import { GraphQLError } from 'graphql';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';

import { schema } from './graphql/schema';

export const pubsub = new PubSub();

const {
  APP_HOST: host,
  APP_PORT: port,
  API_VERSION: api,
  GRAPHQL_ENDPOINT: graphql,
  SUBSCRIPTION_ENDPOINT: subscription,
  JWT_SECRET,
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
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServerCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: subscriptionPath,
  });

  const wsServerCleanup = useServer({ schema }, wsServer);

  // Ensure we wait for our server to start
  await server.start();

  app.use(
    graphqlPath,
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context,
    }),
  );

  // start express
  await new Promise<void>((resolve) => httpServer.listen({
    host,
    port: parseInt(port, 10),
  }, resolve));

  console.log("🚀 Spicy Golf API 🚀");
  console.log(`Server        ready at: http://${host}:${port}${graphqlPath}`);
  console.log(`Subscriptions ready at: http://${host}:${port}${subscriptionPath}`);

};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

StartServer().catch((error) => console.log(error));



const context = async ({ req }) => {
  if (!useAuthentication(req.body?.query)) {
    return
  };

  // validate token for all other endpoints
  const authHeader = req.headers.authorization || '';
  const token = authHeader?.split(' ')[1];

  let user = null;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch(_) {}
  if (!user) {
    throw new GraphQLError('User is not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return user;
};

const useAuthentication = (query: string) => {
  const no_auth_queries = [
    'queryIntrospectionQuery', // TODO: remove me after dev work
    'querylogin',
    'queryregister',
  ];

  let ret = true;

  query = query.replace(/\s/g, "");
  no_auth_queries.map((no_auth) => {
    if (query.startsWith(no_auth)) {
      ret = false;
    }
  });
  return ret;
};
