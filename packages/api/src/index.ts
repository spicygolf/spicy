import { cors } from "@elysiajs/cors";
import type { Context } from "elysia";
import { Elysia } from "elysia";
import type { GolfersSearchRequest } from "ghin";
import { getCountries } from "./countries";
// import { setupWorker } from "./jazz_worker";
import { auth } from "./lib/auth";
import { playerSearch } from "./players";

const {
  API_SCHEME: scheme,
  API_HOST: host,
  API_PORT: port,
  API_VERSION: api,
} = process.env;

const betterAuth = new Elysia({ name: "better-auth" })
  .all(`${api}/auth/*`, (context: Context) => {
    if (["POST", "GET"].includes(context.request.method)) {
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
  });

const app = new Elysia()
  .use(
    cors({
      origin: `${scheme}://${host}:${port}`,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .use(betterAuth)
  .get("/", () => "Spicy Golf API")
  .get(`/${api}`, () => "Spicy Golf API")
  .get(`/${api}/user`, ({ user }) => user, { auth: true })
  .post(
    `/${api}/ghin/players/search`,
    ({ body }) => playerSearch(body as GolfersSearchRequest),
    {
      // auth: true,
    },
  )
  .get(`/${api}/ghin/countries`, () => getCountries(), {
    // auth: true,
  })
  .listen({
    port: port || 3040,
    hostname: host || "localhost",
  });

// setupWorker();

console.log(
  `⛳️ Spicy Golf API is running at ${scheme}://${app.server?.hostname}:${app.server?.port}/${api} ⛳️`,
);
