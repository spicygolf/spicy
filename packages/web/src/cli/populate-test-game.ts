#!/usr/bin/env bun

/**
 * Populate Test Big Game
 *
 * Creates a test Big Game with 48 players and full scores in Jazz.
 *
 * Usage:
 *   bun run packages/web/src/cli/populate-test-game.ts
 *   bun run packages/web/src/cli/populate-test-game.ts --organizer co_zXYZ...
 *   bun run packages/web/src/cli/populate-test-game.ts --delete <gameId>
 *
 * Without args: creates a new 48-player Big Game test game (worker as organizer)
 * With --organizer <accountId>: sets a specific account as organizer
 * With --delete <gameId>: shows deletion info for the test game
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { Group, type ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import {
  Course,
  CourseDefaultTee,
  Facility,
  FacilityGeolocation,
  Game,
  GameHole,
  GameScope,
  type GameSpec,
  Handicap,
  HoleScores,
  ListOfGameHoles,
  ListOfPlayers,
  ListOfRoundToGames,
  ListOfTeams,
  ListOfTeeHoles,
  ListOfTees,
  Player,
  PlayerAccount,
  Round,
  RoundScores,
  RoundToGame,
  Tee,
  TeeHole,
} from "spicylib/schema";
import { copySpecOptions, getSpecField } from "spicylib/scoring";

// Load environment from API package
config({ path: resolve(import.meta.dir, "../../../api/.env") });

const JAZZ_API_KEY = process.env.JAZZ_API_KEY;
const JAZZ_WORKER_ACCOUNT = process.env.JAZZ_WORKER_ACCOUNT;
const JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET;

if (!JAZZ_API_KEY || !JAZZ_WORKER_ACCOUNT || !JAZZ_WORKER_SECRET) {
  console.error("Missing Jazz credentials in packages/api/.env");
  console.error(
    "Required: JAZZ_API_KEY, JAZZ_WORKER_ACCOUNT, JAZZ_WORKER_SECRET",
  );
  process.exit(1);
}

// ─── Course Data ────────────────────────────────────────────────────────────

interface HoleData {
  number: number;
  par: number;
  yards: number;
  handicap: number;
}

const COURSE_HOLES: HoleData[] = [
  { number: 1, par: 4, yards: 405, handicap: 7 },
  { number: 2, par: 5, yards: 530, handicap: 11 },
  { number: 3, par: 3, yards: 185, handicap: 15 },
  { number: 4, par: 4, yards: 435, handicap: 1 },
  { number: 5, par: 4, yards: 390, handicap: 9 },
  { number: 6, par: 3, yards: 165, handicap: 17 },
  { number: 7, par: 4, yards: 420, handicap: 3 },
  { number: 8, par: 5, yards: 545, handicap: 13 },
  { number: 9, par: 4, yards: 380, handicap: 5 },
  { number: 10, par: 4, yards: 415, handicap: 8 },
  { number: 11, par: 3, yards: 195, handicap: 14 },
  { number: 12, par: 4, yards: 445, handicap: 2 },
  { number: 13, par: 5, yards: 520, handicap: 12 },
  { number: 14, par: 4, yards: 375, handicap: 10 },
  { number: 15, par: 3, yards: 175, handicap: 18 },
  { number: 16, par: 4, yards: 430, handicap: 4 },
  { number: 17, par: 4, yards: 400, handicap: 6 },
  { number: 18, par: 5, yards: 555, handicap: 16 },
];

const COURSE_PAR = COURSE_HOLES.reduce((sum, h) => sum + h.par, 0); // 72
const TOTAL_YARDAGE = COURSE_HOLES.reduce((sum, h) => sum + h.yards, 0);

// ─── Player Data ────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  "James",
  "Mike",
  "Tom",
  "Dave",
  "Steve",
  "Chris",
  "Matt",
  "Dan",
  "Rob",
  "Jeff",
  "Brian",
  "Kevin",
  "Mark",
  "Scott",
  "Tim",
  "Ryan",
  "John",
  "Bill",
  "Pat",
  "Rick",
  "Greg",
  "Paul",
  "Joe",
  "Pete",
  "Nick",
  "Sam",
  "Eric",
  "Drew",
  "Ben",
  "Jack",
  "Luke",
  "Zach",
  "Alex",
  "Sean",
  "Tony",
  "Hank",
  "Phil",
  "Carl",
  "Gary",
  "Ray",
  "Vince",
  "Art",
  "Ed",
  "Lou",
  "Frank",
  "Dean",
  "Chip",
  "Bud",
];

const LAST_NAMES = [
  "Johnson",
  "Williams",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "King",
  "Wright",
  "Scott",
  "Green",
  "Baker",
  "Adams",
  "Nelson",
  "Hill",
  "Campbell",
  "Mitchell",
  "Roberts",
  "Carter",
  "Phillips",
  "Evans",
  "Turner",
  "Torres",
  "Parker",
  "Collins",
  "Edwards",
  "Stewart",
  "Morris",
  "Murphy",
];

function generateHandicapIndex(playerIndex: number): number {
  // Spread from +2.0 to 36.0 across 48 players
  // Lower index = better player
  const min = -2.0;
  const max = 36.0;
  const step = (max - min) / 47;
  return Math.round((min + step * playerIndex) * 10) / 10;
}

function formatHandicapIndex(index: number): string {
  if (index < 0) return `+${Math.abs(index).toFixed(1)}`;
  return index.toFixed(1);
}

// ─── Score Generation ───────────────────────────────────────────────────────

function generateScore(par: number, handicapIndex: number): number {
  // Skill: 0 = 36 handicap, 1 = scratch/plus
  const skill = Math.max(0, 36 - handicapIndex) / 36;
  const variance = Math.random();

  if (variance < skill * 0.15) return par - 1; // Birdie
  if (variance < skill * 0.4 + 0.1) return par; // Par
  if (variance < 0.75) return par + 1; // Bogey
  if (variance < 0.92) return par + 2; // Double bogey
  return par + 3; // Triple+
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function deleteMode(gameId: string): Promise<void> {
  console.log(`\nDelete mode for game: ${gameId}\n`);

  const { worker, done } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT,
    accountSecret: JAZZ_WORKER_SECRET,
  });

  try {
    const game = await Game.load(gameId as ID<Game>, {
      loadAs: worker,
      resolve: {
        players: { $each: true },
      },
    });

    if (!game?.$isLoaded) {
      console.error(`Could not load game: ${gameId}`);
      await done();
      process.exit(1);
    }

    console.log(`Game: ${game.name}`);
    console.log(`Legacy ID: ${game.legacyId || "none"}`);
    console.log(`Players: ${game.players?.length ?? 0}`);
    console.log(`Start: ${game.start}`);
    console.log(
      "\nTo delete, remove this game from your games list in the app.",
    );
    console.log("Jazz CoValues cannot be easily deleted from the CLI.\n");
  } catch (err) {
    console.error("Error:", err);
  }

  await done();
}

async function createGame(organizerId?: string): Promise<void> {
  console.log("\nPopulating Big Game test with 48 players...\n");

  const { worker, done } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT,
    accountSecret: JAZZ_WORKER_SECRET,
  });

  try {
    // ── Load catalog spec ──────────────────────────────────────────────
    console.log("Loading catalog...");
    const account = await PlayerAccount.load(
      JAZZ_WORKER_ACCOUNT as ID<typeof PlayerAccount>,
      {
        loadAs: worker,
        resolve: {
          profile: {
            catalog: {
              specs: { $each: { $each: true } },
            },
          },
        },
      },
    );

    if (!account?.$isLoaded || !account.profile?.$isLoaded) {
      console.error("Could not load worker account profile");
      await done();
      process.exit(1);
    }

    const catalog = account.profile.catalog;
    if (!catalog?.$isLoaded || !catalog.specs?.$isLoaded) {
      console.error("Catalog or specs not loaded");
      await done();
      process.exit(1);
    }

    // Find the Big Game spec - keyed as "The Big Game-1"
    const specKey = "The Big Game-1";
    const catalogSpec = catalog.specs[specKey] as GameSpec | undefined;
    if (!catalogSpec?.$isLoaded) {
      console.error(`Spec "${specKey}" not found in catalog`);
      const keys = Object.keys(catalog.specs).filter(
        (k) => !k.startsWith("$") && k !== "_schema",
      );
      console.error(`Available specs: ${keys.join(", ")}`);
      await done();
      process.exit(1);
    }

    const specName = getSpecField(catalogSpec, "name") as string;
    console.log(`Found spec: ${specName} (${catalogSpec.$jazz.id})`);

    // ── Create group ───────────────────────────────────────────────────
    console.log("Creating group...");
    const group = Group.create(worker);

    // Add organizer account to group so they can load/edit the game
    if (organizerId) {
      const organizerAccount = await PlayerAccount.load(
        organizerId as ID<typeof PlayerAccount>,
        { loadAs: worker },
      );
      if (organizerAccount?.$isLoaded) {
        group.addMember(organizerAccount, "admin");
        console.log(`  Added organizer ${organizerId} as admin`);
      } else {
        console.warn(`  Could not load organizer account ${organizerId} — game will be read-only`);
      }
    }

    // ── Create course & tee ────────────────────────────────────────────
    console.log("Creating course and tee...");

    const teeHoles = ListOfTeeHoles.create([], { owner: group });
    for (const hole of COURSE_HOLES) {
      teeHoles.$jazz.push(
        TeeHole.create(
          {
            id: `test-hole-${hole.number}`,
            number: hole.number,
            par: hole.par,
            yards: hole.yards,
            meters: Math.round(hole.yards * 0.9144),
            handicap: hole.handicap,
          },
          { owner: group },
        ),
      );
    }

    const tee = Tee.create(
      {
        id: "test-tee-blue",
        name: "Blue",
        gender: "M",
        holes: teeHoles,
        holesCount: 18,
        totalYardage: TOTAL_YARDAGE,
        totalMeters: Math.round(TOTAL_YARDAGE * 0.9144),
        ratings: {
          total: { rating: 72.5, slope: 130, bogey: 92.1 },
          front: {
            rating: 36.2,
            slope: 129,
            bogey: 45.8,
          },
          back: {
            rating: 36.3,
            slope: 131,
            bogey: 46.3,
          },
        },
      },
      { owner: group },
    );

    const geolocation = FacilityGeolocation.create(
      {
        formatted_address: "123 Golf Lane, Scottsdale, AZ 85260",
        latitude: 33.6,
        longitude: -111.9,
      },
      { owner: group },
    );

    const facility = Facility.create(
      {
        id: "test-facility",
        status: "active",
        name: "Test Links Country Club",
        geolocation,
      },
      { owner: group },
    );

    const defaultTee = CourseDefaultTee.create(
      {
        male: tee,
      },
      { owner: group },
    );

    const teesList = ListOfTees.create([], { owner: group });
    teesList.$jazz.push(tee);

    const course = Course.create(
      {
        id: "test-course",
        status: "active",
        name: "Test Links Golf Club",
        city: "Scottsdale",
        state: "AZ",
        facility,
        season: { name: "Year Round", all_year: true },
        default_tee: defaultTee,
        tees: teesList,
      },
      { owner: group },
    );

    console.log(`  Course: ${course.name} (${course.$jazz.id})`);
    console.log(`  Tee: ${tee.name} (${tee.$jazz.id})`);
    console.log(`  Par: ${COURSE_PAR}, Yards: ${TOTAL_YARDAGE}`);

    // ── Create players ─────────────────────────────────────────────────
    console.log("Creating 48 players...");
    const players = ListOfPlayers.create([], { owner: group });

    const playerData: Array<{
      player: Player;
      handicapIndex: number;
      handicapStr: string;
    }> = [];

    for (let i = 0; i < 48; i++) {
      const handicapIndex = generateHandicapIndex(i);
      const handicapStr = formatHandicapIndex(handicapIndex);
      const firstName = FIRST_NAMES[i] as string;
      const lastName = LAST_NAMES[i] as string;
      const name = `${firstName} ${lastName}`;
      const short = `${firstName.charAt(0)}${lastName}`;

      const handicap = Handicap.create(
        {
          source: "manual",
          display: handicapStr,
          value: handicapIndex,
          revDate: new Date(),
        },
        { owner: group },
      );

      const player = Player.create(
        {
          name,
          short,
          gender: "M",
          handicap,
        },
        { owner: group },
      );

      players.$jazz.push(player);
      playerData.push({ player, handicapIndex, handicapStr });
    }

    const firstPlayer = playerData[0];
    const lastPlayer = playerData[playerData.length - 1];
    if (firstPlayer && lastPlayer) {
      console.log(
        `  Created ${playerData.length} players (handicaps: ${formatHandicapIndex(firstPlayer.handicapIndex)} to ${lastPlayer.handicapStr})`,
      );
    }

    // ── Create rounds with scores ──────────────────────────────────────
    console.log("Creating rounds with scores...");
    const roundToGames = ListOfRoundToGames.create([], { owner: group });

    for (const pd of playerData) {
      // Create scores for all 18 holes
      const scores = RoundScores.create({}, { owner: group });

      for (const hole of COURSE_HOLES) {
        const gross = generateScore(hole.par, pd.handicapIndex);

        const holeScores = HoleScores.create({}, { owner: group });
        holeScores.$jazz.set("gross", String(gross));
        scores.$jazz.set(String(hole.number), holeScores);
      }

      // Calculate course handicap
      const slope = 130;
      const courseHandicap = Math.round((pd.handicapIndex * slope) / 113);

      const round = Round.create(
        {
          start: new Date(),
          playerId: pd.player.$jazz.id,
          handicapIndex: pd.handicapStr,
          course,
          tee,
          scores,
          _v: 2,
        },
        { owner: group },
      );

      const roundToGame = RoundToGame.create(
        {
          round,
          handicapIndex: pd.handicapStr,
          courseHandicap,
        },
        { owner: group },
      );

      roundToGames.$jazz.push(roundToGame);
    }

    console.log(`  Created ${roundToGames.length} rounds`);

    // ── Create game holes ──────────────────────────────────────────────
    console.log("Creating game holes...");
    const gameHoles = ListOfGameHoles.create([], { owner: group });

    for (let i = 0; i < 18; i++) {
      const gameHole = GameHole.create(
        {
          hole: String(i + 1),
          seq: i,
          teams: ListOfTeams.create([], { owner: group }),
        },
        { owner: group },
      );
      gameHoles.$jazz.push(gameHole);
    }

    // ── Create scope ───────────────────────────────────────────────────
    console.log("Creating game scope...");
    const scope = GameScope.create({ holes: "all18" }, { owner: group });

    // ── Copy spec options ──────────────────────────────────────────────
    console.log("Copying spec options...");
    const spec = copySpecOptions(catalogSpec, group);

    // ── Create the game ────────────────────────────────────────────────
    console.log("Creating game...");
    const game = Game.create(
      {
        start: new Date(),
        name: "Big Game Test (48 players)",
        scope,
        spec,
        specRef: catalogSpec,
        holes: gameHoles,
        players,
        rounds: roundToGames,
        organizer: organizerId ?? worker.$jazz.id,
        legacyId: "test-big-game-48",
      },
      { owner: group },
    );

    console.log(`\nGame created successfully!`);
    console.log(`  Game ID: ${game.$jazz.id}`);
    console.log(`  Name: ${game.name}`);
    console.log(`  Organizer: ${game.organizer}${organizerId ? "" : " (worker — read-only for all)"}`);
    console.log(`  Players: ${players.length}`);
    console.log(`  Rounds: ${roundToGames.length}`);
    console.log(`  Holes: ${gameHoles.length}`);
    console.log(`  Spec: ${specName}`);
    console.log(`  Legacy ID: ${game.legacyId}`);

    // ── Wait for sync ──────────────────────────────────────────────────
    console.log("\nSyncing...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("Done.");
    console.log(
      `\nTo delete: bun run packages/web/src/cli/populate-test-game.ts --delete ${game.$jazz.id}`,
    );
  } catch (err) {
    console.error("Error:", err);
  }

  await done();
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function parseFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

if (args.includes("--delete")) {
  const gameId = parseFlag("--delete");
  if (!gameId || !gameId.startsWith("co_")) {
    console.error(
      "Usage: bun run packages/web/src/cli/populate-test-game.ts --delete <gameId>",
    );
    process.exit(1);
  }
  await deleteMode(gameId);
} else if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Populate Test Big Game

Usage:
  bun run packages/web/src/cli/populate-test-game.ts                          Create 48-player Big Game
  bun run packages/web/src/cli/populate-test-game.ts --organizer co_zXYZ...   Set organizer account
  bun run packages/web/src/cli/populate-test-game.ts --delete <gameId>        Show deletion info

Creates a test Big Game with:
  - 48 players with realistic handicaps (+2.0 to 36.0)
  - Full 18-hole scores for each player
  - Standard course (Test Links Golf Club, par 72)
  - Blue tees (72.5/130)
  - Stableford/quota scoring with gross skins
`);
} else {
  const organizerId = parseFlag("--organizer");
  await createGame(organizerId);
}
