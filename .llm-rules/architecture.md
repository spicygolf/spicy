# Spicy Golf

Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context

- This is a monorepo of packages for Spicy Golf, a golf app that tracks games played with complex rules, points, and calculations.
- The app calls the api package sparingly, and only for data that it can't get or doesn't have locally.  
- This allows almost all of the app's functionality to work when the device is offline.  
- To achieve this, we use Jazz Tools, a local-first database with sync capabilities.

## Tech Stack

- React Native
- TypeScript
- Jazz Tools
  - local docs are at /Users/brad/dev/llms/jazz/llms-full.txt
  - docs are at https://jazz.tools/docs
- TypeScript package manager is `bun` 1.3 or higher
- Don't ask to run tests. They have to be run in a React Native app.

## Rules

- Attempt to reduce the amount of code rather than add more.
- Prefer iteration and modularization over code duplication.
- Do not add comments unless explicitly told to do so, or the code is sufficiently complex that it requires comments.
