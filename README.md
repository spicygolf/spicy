# Spicy Golf

Monorepo for all Spicy Golf services and applications

## Development

We use [`bun`](https://bun.sh).  To install dependencies across all packages:

```bash
bun i
```

Current efforts are:
- ~~switch to using `bun` instead of `yarn` for all development~~
- ~~switch from `js` to `ts` for all packages~~
- modernize the mobile app to work offline and use [Jazz](https://jazz.tools) as a local-first data store
- style the mobile app using our own components, styled with `react-native-unistyles` v3+
- add proper support for the new [GHIN API](https://app.swaggerhub.com/apis-docs/GHIN/Admin/1.0)
- ~~move mobile auth from Firebase to BetterAuth~~
- get revenue-ready for the app store releases

## Components

### Mobile App

The main mobile app of Spicy Golf, written in `react-native`.

A bit of history:
- The 0.3 version is in the `packages/app-0.3` folder.  It requires an API (`packages/api-0.3`) to be running, as well as an ArangoDB database.  Note that the `packages/api` folder just got some changes to support the new mobile app.
- The 0.4 version is in the `packages/app-0.4` folder, and is an experiment with using the new `@fireproof/react-native` library for offline/local-first.  Probably ded.
- The 0.5 version is in the `packages/app` folder, and is the first version to use Jazz library for offline/local-first.  `packages/app` is the go-forward version.

```bash
cd packages/app
bun i
bun pods
bun start
```

### API

Just recently reworked as an Elysia server, with server-side bits for BetterAuth.  It needs to support Jazz sync and server workers, as well as provide a light (but authenticated) API for the mobile app to interact with GHIN.  (tbh, I'm not sure if `packages/api/src/ghin` or `packages/ghin` will survive.  I think they are the same ish? code right now)

The old API (in `packages/api-0.3`) is kept for posterity, but we are moving away from the GraphQL schema and models, and ArangoDB backend.

```bash
cd packages/api
bun i

# better-auth schema migrations
bun generate
bun migrate

# start the server
bun dev
```

### GHIN

The GHIN code is in the `packages/ghin` folder, and is used to interact with the GHIN API to get handicaps, courses, tee boxes, holes, yards/meters, ratings, slope, etc.  It is meant to be a library that can be used by the API and maybe the mobile app.

### SpicyLib

The SpicyLib code is in the `packages/lib` folder, and is a library of useful functions and types for the Spicy components to share.  The most important bits will be functions around taking a `Game` JSON data object and scoring it based on the game's rules, players' scores, and course information.  Currently this code is in the `packages/app-0.3/src/common/utils/score.js` and `packages/app-0.3/src/common/utils/ScoringWrapper.js` files.

### Web

The web code is in the `packages/web` folder, and is the web app.  It uses the API and might share some mobile code, if we choose to build it in `react-native-web` (`react-native-unistyles` v3 may help with this, but it may not be worth it to reuse mobile code and give a shittier experience than just using Next.js and having different web code).  The purpose of the web app is to give players a larger screen before/after their round.  The mobile app is still for scoring / in-game experience.

Activities envisioned for the website:
- Customize the rules of a game
- Customize the course
- Set up a tournament / trip
- See reports on player stats (fairways hit, greens in regulation, etc.)
- See reports on lifetime stats vs. other players (ex: Jonny dominates Brad and the current deficit is $1,871.50)
