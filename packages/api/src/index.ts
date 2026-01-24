import { cors } from "@elysiajs/cors";
import type {
  CourseDetailsRequest,
  CourseSearchRequest,
  GolfersSearchRequest,
} from "@spicygolf/ghin";
import { Elysia } from "elysia";
import type { co } from "jazz-tools";
import { PlayerAccount } from "spicylib/schema";
import { getCountries } from "./countries";
import { getCourseDetails, searchCourses } from "./courses";
import { getJazzWorker, setupWorker } from "./jazz_worker";
import {
  importGameSpecsToCatalog,
  importGamesFromFiles,
  resetCatalog,
} from "./lib/catalog";
import { linkPlayerToUser, lookupPlayer } from "./lib/link";
import { playerSearch } from "./players";
import { isAdminAccount, requireAdminAccount } from "./utils/auth";
import { authenticateJazzRequest } from "./utils/jazz-auth";
import {
  checkRateLimit,
  getRateLimitHeaders,
  type RateLimitResult,
} from "./utils/rate-limit";

const {
  API_SCHEME: scheme,
  API_HOST: host,
  API_PORT: apiPort, // External port for URL generation (e.g., 443)
  API_VERSION: api,
  PORT: serverPort, // Internal port for server binding (e.g., 3000 on Fly.io)
} = process.env;

// Guard against concurrent game imports
let gamesImportInProgress = false;

// Server-side cache for error messages (avoid disk I/O on every request)
import type { SeedMessageFile } from "./utils/seed-loader";

let messagesCache: Map<string, SeedMessageFile> | null = null;
let messagesCacheTime = 0;
const MESSAGES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getMessagesWithCache(): Promise<Map<string, SeedMessageFile>> {
  if (messagesCache && Date.now() - messagesCacheTime < MESSAGES_CACHE_TTL) {
    return messagesCache;
  }
  const { loadSeedMessages } = await import("./utils/seed-loader");
  messagesCache = await loadSeedMessages();
  messagesCacheTime = Date.now();
  return messagesCache;
}

/**
 * Jazz authentication plugin
 *
 * Provides stateless authentication using Jazz tokens.
 * Use { jazzAuth: true } on routes to require authentication.
 */
const jazzAuth = new Elysia({ name: "jazz-auth" }).macro({
  jazzAuth: {
    async resolve({ status, request }) {
      const result = await authenticateJazzRequest(request);

      if (result.error) {
        return status(result.error.status);
      }

      return {
        jazzAccount: result.account,
        jazzAccountId: result.accountId,
      };
    },
  },
});

/**
 * Helper to apply rate limiting and return appropriate response
 */
function applyRateLimit(
  accountId: string,
  endpoint: string,
  set: { headers: Record<string, string | number>; status?: number | string },
): RateLimitResult & { blocked: boolean } {
  const result = checkRateLimit(accountId, endpoint);
  const headers = getRateLimitHeaders(result);

  // Add rate limit headers to response
  for (const [key, value] of Object.entries(headers)) {
    set.headers[key] = value;
  }

  if (!result.allowed) {
    set.status = 429;
  }

  return { ...result, blocked: !result.allowed };
}

// Build CORS origin - for HTTPS on port 443, don't include port in URL
// Default to standard ports if API_PORT is not set
const resolvedApiPort = apiPort ?? (scheme === "https" ? "443" : "80");
const corsOrigin =
  resolvedApiPort === "443" || resolvedApiPort === "80"
    ? `${scheme}://${host}`
    : `${scheme}://${host}:${resolvedApiPort}`;

const app = new Elysia()
  .use(
    cors({
      origin: [corsOrigin, "http://localhost:5173", "http://localhost:5000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-jazz-auth"],
      credentials: true,
    }),
  )
  .use(jazzAuth)
  .get("/", () => "Spicy Golf API")
  .get(`/${api}`, () => "Spicy Golf API")
  // GHIN proxy endpoints - protected by Jazz auth + rate limiting
  .post(
    `/${api}/ghin/players/search`,
    ({ body, jazzAccountId, set }) => {
      const rateLimit = applyRateLimit(
        jazzAccountId as string,
        "ghin/players/search",
        set,
      );
      if (rateLimit.blocked) {
        return {
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter,
        };
      }
      return playerSearch(body as GolfersSearchRequest);
    },
    { jazzAuth: true },
  )
  .get(
    `/${api}/ghin/countries`,
    ({ jazzAccountId, set }) => {
      const rateLimit = applyRateLimit(
        jazzAccountId as string,
        "ghin/countries",
        set,
      );
      if (rateLimit.blocked) {
        return {
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter,
        };
      }
      return getCountries();
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/ghin/courses/search`,
    ({ body, jazzAccountId, set }) => {
      const rateLimit = applyRateLimit(
        jazzAccountId as string,
        "ghin/courses/search",
        set,
      );
      if (rateLimit.blocked) {
        return {
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter,
        };
      }
      return searchCourses(body as CourseSearchRequest);
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/ghin/courses/details`,
    ({ body, jazzAccountId, set }) => {
      const rateLimit = applyRateLimit(
        jazzAccountId as string,
        "ghin/courses/details",
        set,
      );
      if (rateLimit.blocked) {
        return {
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter,
        };
      }
      return getCourseDetails(body as CourseDetailsRequest);
    },
    { jazzAuth: true },
  )
  // Auth check endpoint - returns whether current user is admin
  .get(
    `/${api}/auth/is-admin`,
    ({ jazzAccountId }) => ({
      isAdmin: isAdminAccount(jazzAccountId),
    }),
    { jazzAuth: true },
  )
  // Public endpoint for error messages (no auth required)
  // Server-side cache to avoid disk I/O on every request
  .get(`/${api}/messages/:locale`, async ({ params }) => {
    const messages = await getMessagesWithCache();

    const locale = params.locale || "en_US";
    const messageFile = messages.get(locale);

    if (messageFile) {
      return messageFile;
    }

    // Fallback: try canonical {language}_US variant first
    const language = locale.split("_")[0];
    const canonicalFallback = messages.get(`${language}_US`);
    if (canonicalFallback) {
      return canonicalFallback;
    }

    // Then try any matching language
    for (const [key, file] of messages) {
      if (key.startsWith(language)) {
        return file;
      }
    }

    // Ultimate fallback: return en_US or first available
    return (
      messages.get("en_US") ||
      messages.values().next().value || { locale: "en_US", messages: [] }
    );
  })
  // Admin endpoints - protected by Jazz auth + admin check
  .post(
    `/${api}/catalog/reset`,
    async ({ jazzAccountId, body }) => {
      try {
        requireAdminAccount(jazzAccountId);

        const options = body as {
          clearSpecs?: boolean;
          clearOptions?: boolean;
          clearGames?: boolean;
          clearPlayers?: boolean;
          clearCourses?: boolean;
        } | null;

        console.log(
          `Catalog reset started by ${jazzAccountId}`,
          JSON.stringify(options),
        );
        const { account } = await getJazzWorker();

        const result = await resetCatalog(
          account as co.loaded<typeof PlayerAccount>,
          options ?? undefined,
        );
        console.log("Reset result:", JSON.stringify(result));
        return result;
      } catch (error) {
        console.error("Reset failed:", error);
        throw error;
      }
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/catalog/import`,
    async ({ jazzAccountId, body }) => {
      try {
        requireAdminAccount(jazzAccountId);

        const options = body as { specs?: boolean; players?: boolean } | null;
        const importSpecs = options?.specs ?? true;
        const importPlayers = options?.players ?? true;

        console.log(
          `Catalog import started by ${jazzAccountId} (specs: ${importSpecs}, players: ${importPlayers})`,
        );
        const { account } = await getJazzWorker();

        console.log("Calling importGameSpecsToCatalog...");
        const result = await importGameSpecsToCatalog(
          account as co.loaded<typeof PlayerAccount>,
          undefined,
          { specs: importSpecs, players: importPlayers },
        );
        console.log("Import result:", JSON.stringify(result));
        return result;
      } catch (error) {
        console.error("Import failed:", error);
        throw error;
      }
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/catalog/import-games`,
    async ({ body, jazzAccountId }) => {
      try {
        requireAdminAccount(jazzAccountId);

        const { legacyId } = body as { legacyId?: string };

        // For single game imports, don't block on gamesImportInProgress
        if (!legacyId) {
          // Prevent concurrent batch imports
          if (gamesImportInProgress) {
            console.log("Games import already in progress, rejecting request");
            return { error: "Import already in progress", inProgress: true };
          }
          gamesImportInProgress = true;
        }

        console.log(
          legacyId
            ? `Single game import started by: ${jazzAccountId} for legacyId: ${legacyId}`
            : `Batch games import started by: ${jazzAccountId}`,
        );

        try {
          const { account } = await getJazzWorker();

          console.log("Calling importGamesFromFiles...");
          const result = await importGamesFromFiles(
            account as co.loaded<typeof PlayerAccount>,
            legacyId ? { legacyId } : undefined,
          );
          console.log("Games import result:", JSON.stringify(result));
          return result;
        } finally {
          if (!legacyId) {
            gamesImportInProgress = false;
          }
        }
      } catch (error) {
        console.error("Games import failed:", error);
        gamesImportInProgress = false;
        throw error;
      }
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/player/lookup`,
    async ({ body }) => {
      try {
        const { ghinId } = body as { ghinId: string };
        if (!ghinId) {
          throw new Error("GHIN ID required");
        }

        console.log(`Looking up player with GHIN ${ghinId}`);

        // Get the worker account to access catalog
        const { account: workerAccount } = await getJazzWorker();

        // Delegate to the lookup function
        const result = await lookupPlayer(
          ghinId,
          workerAccount as co.loaded<typeof PlayerAccount>,
        );

        return result;
      } catch (error) {
        console.error("Player lookup failed:", error);
        throw error;
      }
    },
    // No jazzAuth required - this is a read-only preview
  )
  .post(
    `/${api}/player/link`,
    async ({ body, jazzAccountId }) => {
      try {
        if (!jazzAccountId) {
          throw new Error("User not authenticated or no Jazz account");
        }

        console.log(`[/player/link] body:`, JSON.stringify(body));

        const { ghinId } = body as { ghinId: string };
        if (!ghinId) {
          throw new Error("GHIN ID required");
        }

        console.log(
          `Linking player with GHIN ${ghinId} to account ${jazzAccountId}`,
        );

        // Load the user's Jazz account
        const userAccount = await PlayerAccount.load(jazzAccountId);
        if (!userAccount?.$isLoaded) {
          throw new Error("User account not found");
        }

        // Get the worker account
        const { account: workerAccount } = await getJazzWorker();

        // Delegate to the link module
        const result = await linkPlayerToUser(
          userAccount,
          ghinId,
          workerAccount as co.loaded<typeof PlayerAccount>,
          jazzAccountId,
        );

        return result;
      } catch (error) {
        console.error("Player link failed:", error);
        throw error;
      }
    },
    { jazzAuth: true },
  )
  .post(
    `/${api}/catalog/import-course-by-id`,
    async ({ body, jazzAccountId }) => {
      try {
        // Requires Jazz auth but not admin (any authenticated user can import courses)

        const { courseId } = body as { courseId: string | number };
        if (!courseId) {
          throw new Error("courseId required");
        }

        console.log(
          `Importing course ${courseId} from GHIN by ${jazzAccountId}`,
        );

        const { account: workerAccount } = await getJazzWorker();
        const { loadOrCreateCatalog } = await import("./lib/catalog");
        const catalog = await loadOrCreateCatalog(
          workerAccount as co.loaded<typeof PlayerAccount>,
        );

        // Load catalog courses map
        const loadedCatalog = await catalog.$jazz.ensureLoaded({
          resolve: { courses: {} },
        });

        if (!loadedCatalog.courses) {
          throw new Error("Catalog courses not loaded");
        }

        const coursesMap = loadedCatalog.courses;
        const courseKey = String(courseId);

        // Check if course already exists
        const existingCourse = coursesMap[courseKey];
        if (existingCourse) {
          return {
            success: true,
            existed: true,
            message: `Course ${courseId} already exists in catalog`,
          };
        }

        // Fetch course from GHIN API
        const { getCourseDetails } = await import("./courses");
        type CourseDetailsResponse = Awaited<
          ReturnType<typeof getCourseDetails>
        >;
        let courseData: CourseDetailsResponse;
        try {
          courseData = await getCourseDetails({ course_id: Number(courseId) });
        } catch (error) {
          return {
            success: false,
            error: `Failed to fetch course from GHIN: ${error instanceof Error ? error.message : String(error)}`,
          };
        }

        // Import the course (simplified version - just create the course, no tees for now)
        const { Course, CourseDefaultTee, ListOfTees } = await import(
          "spicylib/schema"
        );
        const { Group } = await import("jazz-tools");

        const group = Group.create(workerAccount);
        group.makePublic();

        const newCourse = Course.create(
          {
            id: String(courseData.CourseId),
            status: courseData.CourseStatus.toLowerCase(),
            name: courseData.CourseName,
            city: courseData.CourseCity || "",
            state: courseData.CourseState || "",
            season: { all_year: true },
            default_tee: CourseDefaultTee.create({}, { owner: group }),
            tees: ListOfTees.create([], { owner: group }),
          },
          { owner: group },
        );

        coursesMap.$jazz.set(courseKey, newCourse);

        return {
          success: true,
          created: true,
          courseId: courseData.CourseId,
          courseName: courseData.CourseName,
          courseStatus: courseData.CourseStatus,
          message: `Course ${courseData.CourseName} (${courseId}) imported successfully`,
        };
      } catch (error) {
        console.error("Course import failed:", error);
        throw error;
      }
    },
    { jazzAuth: true },
  )
  .listen({
    port: serverPort || 3040,
    hostname: "0.0.0.0", // Bind to all interfaces for container environments
  });

setupWorker();

console.log(
  `⛳️ Spicy Golf API is running at ${scheme}://${app.server?.hostname}:${app.server?.port}/${api} ⛳️`,
);
