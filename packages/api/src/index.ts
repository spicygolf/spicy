import { cors } from "@elysiajs/cors";
import type {
  CourseDetailsRequest,
  CourseSearchRequest,
  GolfersSearchRequest,
} from "@spicygolf/ghin";
import type { Context } from "elysia";
import { Elysia } from "elysia";
import type { co } from "jazz-tools";
import type { PlayerAccount } from "spicylib/schema";
import { getCountries } from "./countries";
import { getCourseDetails, searchCourses } from "./courses";
import { getJazzWorker, setupWorker } from "./jazz_worker";
import { auth } from "./lib/auth";
import { importGameSpecsToCatalog } from "./lib/catalog";
import { playerSearch } from "./players";
import type { ArangoConfig } from "./utils/arango";
import { requireAdmin } from "./utils/auth";

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
      origin: [`${scheme}://${host}:${port}`, "http://localhost:5173"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-jazz-auth"],
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
  .post(
    `/${api}/ghin/courses/search`,
    ({ body }) => searchCourses(body as CourseSearchRequest),
    {
      // auth: true,
    },
  )
  .post(
    `/${api}/ghin/courses/details`,
    ({ body }) => getCourseDetails(body as CourseDetailsRequest),
    {
      // auth: true,
    },
  )
  .get(`/${api}/jazz/credentials`, () => ({
    apiKey: process.env.JAZZ_API_KEY,
    workerAccount: process.env.JAZZ_WORKER_ACCOUNT,
  }))
  .post(
    `/${api}/catalog/import`,
    async ({ body, user }) => {
      try {
        // Server-side admin authorization check
        requireAdmin(user?.email);

        console.log("Catalog import started by admin:", user.email);
        const arangoConfig = body as ArangoConfig | undefined;
        const { account } = await getJazzWorker();

        console.log("Calling importGameSpecsToCatalog...");
        const result = await importGameSpecsToCatalog(
          account as co.loaded<typeof PlayerAccount>,
          arangoConfig,
        );
        console.log("Import result:", JSON.stringify(result));
        return result;
      } catch (error) {
        console.error("Import failed:", error);
        throw error;
      }
    },
    {
      auth: true,
    },
  )
  .listen({
    port: port || 3040,
    hostname: host || "localhost",
  });

setupWorker();

console.log(
  `⛳️ Spicy Golf API is running at ${scheme}://${app.server?.hostname}:${app.server?.port}/${api} ⛳️`,
);
