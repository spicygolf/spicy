# CI Debugging Skill

How to debug CI failures in GitHub Actions.

## Critical: Run Tests Locally First

**ALWAYS run tests locally before assuming CI is the source of truth.**

When CI fails, the failure is almost always reproducible locally. Before diving into CI logs:

```bash
# Run all quality checks (what CI runs)
./scripts/code-quality.sh

# TypeScript compilation
bun tsc

# Linting
bun lint

# Run tests for a specific package
bun --filter spicy-golf test
bun --filter spicylib test
```

## Common Mistake: Checking CI Logs Before Running Locally

**DON'T** immediately run `gh run view` or `gh pr checks` when tests fail.

**DO** run the failing tests locally first:
1. Tests run faster locally
2. You can debug interactively
3. You avoid parsing noisy CI logs
4. The fix iteration is much faster

## When to Check CI Logs

Only check CI logs when:
1. Tests pass locally but fail in CI (environment difference)
2. You need to see the exact error message from a CI-only failure
3. The failure is in CI infrastructure (not test code)

## How to Get CI Failure Logs (When Needed)

```bash
# Check which checks failed
gh pr checks <PR_NUMBER>

# Get the run ID for the failed workflow
gh run list --workflow="Backend Integration Tests" --branch=<branch> --limit=1 --json databaseId --jq '.[0].databaseId'

# View failed job logs - use RUN ID (not job ID!)
gh run view <RUN_ID> --log-failed

# Search for specific errors
gh run view <RUN_ID> --log 2>&1 | grep -A 10 "FAIL\|Error"
```

### Common Mistake: Job ID vs Run ID (404 Error)

**DON'T** use the job ID from `gh pr checks` URLs with `gh run view`:

```bash
# BAD - job ID from gh pr checks URL returns 404 on private repos
gh run view 12345678 --log-failed  # This is a JOB ID, not a run ID!
```

**DO** get the run ID (databaseId) from `gh run list` first:

```bash
# GOOD - get the RUN ID first
RUN_ID=$(gh run list --workflow="Backend Integration Tests" --branch=feat/my-branch --limit=1 --json databaseId --jq '.[0].databaseId')

# Then view logs with run ID
gh run view $RUN_ID --log-failed
```

The `gh pr checks` output shows job IDs in URLs, but those don't work with `gh run view`. 
Always get the **run ID** from `gh run list` first.

## Git Commit Timeout

**IMPORTANT**: Git commits run pre-commit hooks which can take 30+ seconds.

When calling the Bash tool for `git commit`, you MUST specify a timeout of at least 30000ms (30 seconds):

- **BAD**: Using the default 10000ms timeout - will timeout before hooks complete
- **GOOD**: Using 30000ms timeout - allows pre-commit hooks to finish

Pre-commit hooks run:
- `bun format` (formatting check)
- `bun lint` (ESLint)
- `bun tsc` (TypeScript compilation)

These can take 15-45 seconds depending on the codebase state.
