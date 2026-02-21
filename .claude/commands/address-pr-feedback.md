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

# Check PR comments for bot activity (MUST use --paginate for large PRs)
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" --paginate \
  --jq '[.[] | .user.login] | unique'
```

**CodeRabbit**: Look for a PR comment containing "Walkthrough" or a review with `coderabbitai[bot]` as author. If not present, inform the user:
> "CodeRabbit hasn't reviewed this PR yet. Wait for its review or run `@coderabbitai review` as a PR comment, then re-run this command."

**If the bot hasn't finished, stop here.** Do not proceed to fixing issues with incomplete feedback.

### 3. Fetch ALL review comments

**CRITICAL**: Always use `--paginate` with `gh api` for review comments. The default page size is 30, which is easily exceeded when CodeRabbit posts 16+ inline comments plus replies. Without `--paginate`, you will miss comments from later review passes.

#### 3a. Inline review comments

```bash
# Get ALL review comments — MUST use --paginate
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" --paginate --jq '.[] | {
  id: .id,
  author: .user.login,
  path: .path,
  line: .line,
  body: .body,
  in_reply_to_id: .in_reply_to_id,
  created_at: .created_at
}'
```

To identify **new unaddressed root comments**, filter by:
- `in_reply_to_id == null` (root comment, not a reply)
- `user.login == "coderabbitai[bot]"`
- No reply from `boorad` exists with matching `in_reply_to_id`

Useful shortcut to see how many batches exist:
```bash
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" --paginate \
  --jq '.[] | select(.user.login == "coderabbitai[bot]") | select(.in_reply_to_id == null) | .created_at' \
  | sort | uniq -c | sort -rn
```
Each unique timestamp cluster represents one review pass.

#### 3b. Outside-diff-range comments (in review body)

CodeRabbit posts "outside diff range" comments in the **review body**, not as inline comments. These are easy to miss.

```bash
# Get ALL CodeRabbit CHANGES_REQUESTED reviews with their bodies
gh api "repos/{owner}/{repo}/pulls/{pr}/reviews" --paginate \
  --jq '.[] | select(.user.login == "coderabbitai[bot]") | select(.body | length > 0) | {id: .id, state: .state, submitted_at: .submitted_at}'
```

Then fetch each review body:
```bash
gh api "repos/{owner}/{repo}/pulls/{pr}/reviews/{review_id}" --jq '.body'
```

Look for the `<summary>⚠️ Outside diff range comments (N)</summary>` section in the body. Parse these — they contain file paths, line numbers, and the same comment format as inline comments.

#### 3c. General PR comments

```bash
gh pr view --json comments --jq '.comments[] | {
  author: .author.login,
  body: .body,
  createdAt: .createdAt
}'
```

### 4. Identify actionable feedback

Collect ALL comments from:
- Inline review comments (3a)
- Outside-diff-range comments from review bodies (3b)
- General PR comments (3c)

Filter to unaddressed items from `coderabbitai[bot]`.

For each comment, determine:
1. **Valid concern** — fix it
2. **False positive** — reply explaining why
3. **Stale** — code was already changed/removed since the comment was posted
4. **Ambiguous** — ask the user which direction to take

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

For false positives / stale:
1. Reply to the review comment thread explaining why:
   ```bash
   gh api "repos/{owner}/{repo}/pulls/{pr}/comments" \
     -X POST -f body="<explanation of why this is safe / stale>" \
     -F in_reply_to={comment_id}
   ```

For outside-diff-range comments (no inline comment ID to reply to):
1. Post a general PR comment summarizing fixes and dismissals for outside-diff items:
   ```bash
   gh pr comment {pr} --body "<summary of outside-diff responses>"
   ```

### 6. Run quality gates

After all fixes are applied:

```bash
./scripts/code-quality.sh
```

All must pass before committing.

### 7. Commit and push

If any code changes were made:

```bash
git add <specific files>
git commit -m "fix: address PR review feedback from CodeRabbit"
git push
```

### 8. Report summary

Present a summary to the user:

- **Fixed**: List of issues that were fixed with brief descriptions
- **Dismissed**: List of false positives with reasoning
- **Stale**: Comments on code that was already changed/removed
- **Needs input**: Any ambiguous items requiring user decision
- **Quality gates**: Pass/fail status
