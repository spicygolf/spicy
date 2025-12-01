import { cors } from "@elysiajs/cors";
import type {
  CourseDetailsRequest,
  CourseSearchRequest,
  GolfersSearchRequest,
} from "@spicygolf/ghin";
import type { Context } from "elysia";
import { Elysia } from "elysia";
import type { co, Group } from "jazz-tools";
import { PlayerAccount } from "spicylib/schema";
import { getCountries } from "./countries";
import { getCourseDetails, searchCourses } from "./courses";
import { getJazzWorker, setupWorker } from "./jazz_worker";
import { auth } from "./lib/auth";
import { importGameSpecsToCatalog, loadOrCreateCatalog } from "./lib/catalog";
import { playerSearch } from "./players";
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
    async ({ user }) => {
      try {
        // Server-side admin authorization check
        requireAdmin(user?.email);

        console.log("Catalog import started by admin:", user.email);
        const { account } = await getJazzWorker();

        console.log("Calling importGameSpecsToCatalog...");
        // API uses its own ArangoDB config from environment variables
        const result = await importGameSpecsToCatalog(
          account as co.loaded<typeof PlayerAccount>,
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
  .post(
    `/${api}/player/link`,
    async ({ body, user }) => {
      try {
        // Jazz plugin adds accountID to user object
        const jazzAccountId = (user as { accountID?: string })?.accountID;

        if (!jazzAccountId) {
          throw new Error("User not authenticated or no Jazz account");
        }

        const { ghinId } = body as { ghinId: string };
        if (!ghinId) {
          throw new Error("GHIN ID required");
        }

        console.log(
          `Linking player with GHIN ${ghinId} to user ${user?.email} (${jazzAccountId})`,
        );

        // Load the user's Jazz account
        const userAccount = await PlayerAccount.load(jazzAccountId);
        if (!userAccount?.$isLoaded) {
          throw new Error("User account not found");
        }

        // Find the imported player by GHIN ID
        const { account: workerAccount } = await getJazzWorker();

        console.log(
          `Looking for player with GHIN ${ghinId} owned by worker ${workerAccount.$jazz.id}`,
        );

        // Load the catalog using the helper function
        const catalog = await loadOrCreateCatalog(
          workerAccount as co.loaded<typeof PlayerAccount>,
        );

        // Ensure players map is loaded
        const loadedCatalog = await catalog.$jazz.ensureLoaded({
          resolve: { players: {} },
        });

        if (!loadedCatalog.players) {
          throw new Error(
            "Catalog players not initialized. Please run player import first.",
          );
        }

        const catalogPlayers = loadedCatalog.players;
        const playerRef = catalogPlayers[ghinId];

        if (!playerRef) {
          throw new Error(
            `Player with GHIN ID ${ghinId} not found. Have you run the import?`,
          );
        }

        const playerId = playerRef.$jazz.id;
        const playerName = playerRef.$isLoaded ? playerRef.name : "Player";

        console.log(
          `Found player ${ghinId} in catalog: ${playerId}. Adding user ${user?.email} to owner group...`,
        );

        // Access the owner group - $jazz.owner is available even on unloaded CoMaps
        // TypeScript doesn't properly narrow the type, so we use a type assertion through unknown
        const playerOwner = (
          playerRef as unknown as { $jazz: { owner: unknown } }
        ).$jazz.owner;

        if (
          playerOwner &&
          typeof playerOwner === "object" &&
          "addMember" in playerOwner
        ) {
          // Add user to the player's owner group so they can access it
          (playerOwner as Group).addMember(userAccount, "admin");
          console.log(`Added ${user?.email} as admin to player owner group`);
        } else {
          console.warn("Player owner is not a group, cannot add user");
        }

        return {
          success: true,
          playerId: playerId,
          playerName: playerName,
          message: `Added you to player group. Setting root.player...`,
        };
      } catch (error) {
        console.error("Player link failed:", error);
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
