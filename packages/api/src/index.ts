import { cors } from "@elysiajs/cors";
import type {
  CourseDetailsRequest,
  CourseSearchRequest,
  GolfersSearchRequest,
} from "@spicygolf/ghin";
import type { Context } from "elysia";
import { Elysia } from "elysia";
import type { co } from "jazz-tools";
import { PlayerAccount } from "spicylib/schema";
import { getCountries } from "./countries";
import { getCourseDetails, searchCourses } from "./courses";
import { getJazzWorker, setupWorker } from "./jazz_worker";
import { auth } from "./lib/auth";
import { importGameSpecsToCatalog, importGamesFromArango } from "./lib/catalog";
import { linkPlayerToUser } from "./lib/link";
import { playerSearch } from "./players";
import { requireAdmin } from "./utils/auth";

const {
  API_SCHEME: scheme,
  API_HOST: host,
  API_PORT: port,
  API_VERSION: api,
} = process.env;

// Guard against concurrent game imports
let gamesImportInProgress = false;

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
    async ({ user, body }) => {
      try {
        requireAdmin(user?.email);

        const options = body as { specs?: boolean; players?: boolean } | null;
        const importSpecs = options?.specs ?? true;
        const importPlayers = options?.players ?? true;

        console.log(
          `Catalog import started by ${user.email} (specs: ${importSpecs}, players: ${importPlayers})`,
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
    { auth: true },
  )
  .post(
    `/${api}/catalog/import-games`,
    async ({ body, user }) => {
      try {
        requireAdmin(user?.email);

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
            ? `Single game import started by: ${user.email} for legacyId: ${legacyId}`
            : `Batch games import started by: ${user.email}`,
        );

        try {
          const { account } = await getJazzWorker();

          console.log("Calling importGamesFromArango...");
          const result = await importGamesFromArango(
            account as co.loaded<typeof PlayerAccount>,
            undefined,
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
    { auth: true },
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

        // Get the worker account
        const { account: workerAccount } = await getJazzWorker();

        // Delegate to the link module
        const result = await linkPlayerToUser(
          userAccount,
          ghinId,
          workerAccount as co.loaded<typeof PlayerAccount>,
          user?.email || "unknown",
        );

        return result;
      } catch (error) {
        console.error("Player link failed:", error);
        throw error;
      }
    },
    {
      auth: true,
    },
  )
  .post(
    `/${api}/catalog/import-course-by-id`,
    async ({ body, user }) => {
      try {
        // Temporary endpoint - no admin check needed

        const { courseId } = body as { courseId: string | number };
        if (!courseId) {
          throw new Error("courseId required");
        }

        console.log(`Importing course ${courseId} from GHIN by ${user.email}`);

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
    { auth: true },
  )
  .listen({
    port: port || 3040,
    hostname: host || "localhost",
  });

setupWorker();

console.log(
  `⛳️ Spicy Golf API is running at ${scheme}://${app.server?.hostname}:${app.server?.port}/${api} ⛳️`,
);
