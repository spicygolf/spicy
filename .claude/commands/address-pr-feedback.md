# Address PR Feedback

Fetch and address all review bot feedback on the current PR.

## Instructions

### 1. Identify the PR

```bash
gh pr view --json number,url,state --jq '{number, url, state}'
```

If no PR exists for the current branch, abort with a message.

### 2. Check that review bots are done

CodeRabbit reviews asynchronously. Before addressing feedback, verify it has finished.

```bash
# Get all reviews on the PR
gh pr view --json reviews --jq '.reviews[] | {author: .author.login, state: .state}'

# Check PR comments for bot activity
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" \
  --jq '[.[] | .user.login] | unique'
```

**CodeRabbit**: Look for a PR comment containing "Walkthrough" or a review with `coderabbitai[bot]` as author. If not present, inform the user:
> "CodeRabbit hasn't reviewed this PR yet. Wait for its review or run `@coderabbitai review` as a PR comment, then re-run this command."

**If the bot hasn't finished, stop here.** Do not proceed to fixing issues with incomplete feedback.

### 3. Fetch all review comments

```bash
# Get all review comments with full context
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" --jq '.[] | {
  id: .id,
  author: .user.login,
  path: .path,
  line: .line,
  body: .body,
  in_reply_to_id: .in_reply_to_id,
  created_at: .created_at
}'
```

Also fetch general PR comments (CodeRabbit posts its summary here):

```bash
gh pr view --json comments --jq '.comments[] | {
  author: .author.login,
  body: .body,
  createdAt: .createdAt
}'
```

### 4. Identify actionable feedback

Filter to root comments (not replies) from bots that haven't been addressed:

- **CodeRabbit** (`coderabbitai[bot]`): Inline review comments on specific files/lines

For each comment, determine:
1. **Valid concern** — fix it
2. **False positive** — reply explaining why
3. **Ambiguous** — ask the user which direction to take

### 5. Address each item

For valid concerns:
1. Read the file and understand the context around the flagged line
2. Apply the fix
3. Reply to the review comment thread explaining what was fixed:
   ```bash
   gh api "repos/{owner}/{repo}/pulls/{pr}/comments" \
     -X POST -f body="Fixed — <brief explanation>" \
     -F in_reply_to={comment_id}
   ```

For false positives:
1. Reply to the review comment thread explaining why it's not an issue:
   ```bash
   gh api "repos/{owner}/{repo}/pulls/{pr}/comments" \
     -X POST -f body="<explanation of why this is safe>" \
     -F in_reply_to={comment_id}
   ```

### 6. Run quality gates

After all fixes are applied:

```bash
./scripts/code-quality.sh
bun test
```

All must pass before committing.

### 7. Commit and push

If any code changes were made:

```bash
git add -A
git commit -m "fix: address PR review feedback from CodeRabbit"
git push
```

### 8. Report summary

Present a summary to the user:

- **Fixed**: List of issues that were fixed with brief descriptions
- **Dismissed**: List of false positives with reasoning
- **Needs input**: Any ambiguous items requiring user decision
- **Quality gates**: Pass/fail status
