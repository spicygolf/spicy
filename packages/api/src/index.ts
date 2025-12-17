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
import {
  importGameSpecsToCatalog,
  importGamesFromArango,
  loadOrCreateCatalog,
} from "./lib/catalog";
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

        // Get player ID and load it properly using Player.load()
        const playerId = playerRef.$jazz.id;
        const { Player } = await import("spicylib/schema");
        const loadedPlayer = await Player.load(playerId, {});

        if (!loadedPlayer?.$isLoaded) {
          throw new Error(`Failed to load player ${ghinId}`);
        }

        const playerName = loadedPlayer.name;
        const legacyPlayerId = loadedPlayer.legacyId;

        console.log(
          `Found player ${ghinId} in catalog: ${playerId} (legacy: ${legacyPlayerId}). Adding user ${user?.email} to owner group...`,
        );

        // Now we can safely access $jazz.owner on the loaded player
        const playerOwner = loadedPlayer.$jazz.owner;

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

        // Find all games that this player participated in
        const gameIds: string[] = [];

        // TODO: Re-enable games linking after favorites import is working
        console.log(`Skipping games linking for faster testing...`);

        // // Ensure catalog.games is loaded
        // const catalogWithGames = await loadedCatalog.$jazz.ensureLoaded({
        //   resolve: { games: {} },
        // });

        // if (catalogWithGames.games) {
        //   console.log(`Searching for games with player ${playerId}...`);

        //   // Iterate through all games in the catalog
        //   const { Game } = await import("spicylib/schema");
        //   for (const [legacyId, gameRef] of Object.entries(
        //     catalogWithGames.games,
        //   )) {
        //     // Load the game to check its players list
        //     const gameId = gameRef.$jazz.id;
        //     const loadedGame = await Game.load(gameId, {
        //       resolve: { players: true },
        //     });

        //     if (!loadedGame?.$isLoaded) {
        //       console.warn(`Game ${legacyId} failed to load, skipping`);
        //       continue;
        //     }

        //     // Check if this player is in the game's players list
        //     if (loadedGame.players?.$isLoaded) {
        //       for (const player of loadedGame.players as Iterable<
        //         (typeof loadedGame.players)[number]
        //       >) {
        //         if (player?.$isLoaded && player.$jazz.id === playerId) {
        //           console.log(`Found player in game ${legacyId}`);
        //           gameIds.push(loadedGame.$jazz.id);

        //           // Add user to the game's owner group so they can access it
        //           const gameOwner = loadedGame.$jazz.owner;

        //           if (
        //             gameOwner &&
        //             typeof gameOwner === "object" &&
        //             "addMember" in gameOwner
        //           ) {
        //             (gameOwner as Group).addMember(userAccount, "admin");
        //             console.log(
        //               `Added ${user?.email} to game ${legacyId} owner group`,
        //             );
        //           }

        //           break; // Player found in this game, move to next game
        //         }
        //       }
        //     }
        //   }

        //   console.log(`Found ${gameIds.length} games for player ${playerId}`);
        // }

        // Import favorites for this player
        let favoritesResult = {
          favoritePlayers: 0,
          favoriteCourseTees: 0,
          errors: [] as string[],
        };

        // Load userAccount.root to set the player and import favorites
        const loadedUserAccount = await userAccount.$jazz.ensureLoaded({
          resolve: { root: true },
        });

        if (!loadedUserAccount.root?.$isLoaded) {
          throw new Error("User account root not loaded");
        }

        // Set root.player so the web app can access it
        loadedUserAccount.root.$jazz.set("player", loadedPlayer);
        console.log(`Set root.player to ${playerName}`);

        // Now import favorites using the legacyId
        console.log(
          `[/player/link] About to import favorites. legacyPlayerId=${legacyPlayerId}`,
        );
        if (legacyPlayerId) {
          console.log(
            `[/player/link] Calling importFavoritesForPlayer for ${legacyPlayerId}...`,
          );
          const { importFavoritesForPlayer, loadOrCreateCatalog } =
            await import("./lib/catalog");
          console.log(
            `[/player/link] Function imported, getting catalog ID...`,
          );
          const catalog = await loadOrCreateCatalog(
            workerAccount as co.loaded<typeof PlayerAccount>,
          );
          const catalogId = catalog.$jazz.id;
          console.log(
            `[/player/link] Calling with userAccount.id=${userAccount.$jazz.id}, catalogId=${catalogId}`,
          );
          favoritesResult = await importFavoritesForPlayer(
            userAccount,
            legacyPlayerId,
            catalogId,
            workerAccount as co.loaded<typeof PlayerAccount>,
          );
          console.log(
            `[/player/link] Favorites imported: ${favoritesResult.favoritePlayers} players, ${favoritesResult.favoriteCourseTees} course/tees`,
          );
          if (favoritesResult.errors.length > 0) {
            console.error(
              `[/player/link] Favorites import errors:`,
              favoritesResult.errors,
            );
          }
        } else {
          console.warn(
            "[/player/link] No legacyId found for player, skipping favorites import",
          );
        }

        return {
          success: true,
          playerId: playerId,
          playerName: playerName,
          gameIds: gameIds,
          favorites: {
            players: favoritesResult.favoritePlayers,
            courseTees: favoritesResult.favoriteCourseTees,
            errors: favoritesResult.errors,
          },
          message: `Added you to player group and ${gameIds.length} game(s). Imported ${favoritesResult.favoritePlayers} favorite players and ${favoritesResult.favoriteCourseTees} favorite course/tees.`,
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
