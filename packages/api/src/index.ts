import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import type { Context } from "elysia";
import { auth } from './lib/auth';

const {
  API_HOST: host,
  API_PORT: port,
  API_VERSION: api,
} = process.env;

const betterAuth = new Elysia({ name: "better-auth"})
  .all(`${api}/auth/*`, (context: Context) => {
    if (['POST', 'GET'].includes(context.request.method)) {
      return auth.handler(context.request);
    }
    context.status(405);
  })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  })

const app = new Elysia()
  .use(cors({
    origin: "http://localhost:3030",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }))
  .use(betterAuth)
  .get("/", () => "Spicy Golf API")
  .get(`/${api}/user`, ({ user }) => user, {
    auth: true,
  })
  .listen({
    port: port || 3030,
    hostname: host || 'localhost',
  });

console.log(
  `⛳️ Spicy Golf API is running at http://${app.server?.hostname}:${app.server?.port} ⛳️`
);
