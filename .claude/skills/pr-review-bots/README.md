# PR Review Bots Skill

Interacting with automated PR review bots on GitHub.

## Available Bots

### CodeRabbit

AI-powered code review bot that automatically reviews PRs.

**How to interact:**

```text
@coderabbitai {message}
```

**Common commands:**

| Command | Description |
|---------|-------------|
| `@coderabbitai` | Ask a question or request clarification |
| `@coderabbitai re-review` | Request a fresh review of the PR |
| `@coderabbitai summary` | Get a summary of the changes |
| `@coderabbitai help` | List available commands |

**Where to use:** In PR comments or review comment threads.

**Tips:**
- CodeRabbit responds in the same thread where you mention it
- If you don't see the response, refresh the page - GitHub doesn't always live-update comment threads
- CodeRabbit may flag false positives; it will acknowledge mistakes when you ask follow-up questions

#### Fetching CodeRabbit Comments with gh CLI

CodeRabbit posts two types of comments:

1. **PR comments** (general summary): Use `gh pr view`
2. **Review comments** (inline on specific lines): Use the pulls comments API

#### API Endpoint Differences

There are TWO different endpoints for review comments:

| Endpoint | Use Case |
|----------|----------|
| `repos/{owner}/{repo}/pulls/{pr}/comments` | List all review comments on a PR |
| `repos/{owner}/{repo}/pulls/comments/{id}` | Get a single comment by ID (note: NO pr number!) |

**To list all review comments on a PR:**
```bash
# Get all review comments for PR #194
gh api "repos/{owner}/{repo}/pulls/194/comments"

# Filter to just CodeRabbit comments
gh api "repos/{owner}/{repo}/pulls/194/comments" \
  --jq '.[] | select(.user.login == "coderabbitai[bot]")'
```

**To get a specific comment by ID:**
```bash
# CORRECT: Use pulls/comments/{id} (no PR number)
gh api "repos/{owner}/{repo}/pulls/comments/{comment_id}"

# WRONG: This returns 404!
gh api "repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}"
```

**To find unresolved CodeRabbit comments:**
```bash
# Get root comments (in_reply_to_id == null) that have no replies
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" --jq '
  # Get IDs that have replies
  ([.[] | .in_reply_to_id | select(. != null)] | unique) as $replied |
  # Filter CodeRabbit root comments with no replies
  [.[] | select(.user.login == "coderabbitai[bot]" and .in_reply_to_id == null and ([.id] | inside($replied) | not))] |
  .[] | {id: .id, path: .path, body: .body[0:200]}'
```

**To reply directly to an inline comment thread:**
```bash
# Reply to a specific review comment (this creates a threaded reply)
# Use POST to the PR comments endpoint with in_reply_to parameter
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" -X POST \
  -f body="Your reply message here" \
  -F in_reply_to={parent_comment_id}

# NOTE: The /replies endpoint returns 404 - use the method above instead
# WRONG: gh api "repos/{owner}/{repo}/pulls/comments/{id}/replies"
```

**To find replies to a comment thread:**
```bash
# Get all review comments, then filter by in_reply_to_id
gh api "repos/{owner}/{repo}/pulls/{pr_number}/comments" | \
  jq '.[] | select(.in_reply_to_id == {parent_comment_id})'
```

**Comment ID sources:**
- From GitHub URL: `#discussion_r2709387907` → comment ID is `2709387907`
- From API response: the `id` field

#### Responding to CodeRabbit (Best Practice)

**For best results, reply directly in the inline review comment thread**, not as a general PR comment. CodeRabbit works best when you "initiate chat on the files or code changes."

- **To challenge a false positive**: Reply in that specific comment thread
- **To ask for clarification**: Reply in that specific comment thread  
- **To acknowledge/dismiss**: Reply in that specific comment thread

Example: `@coderabbitai Can you check again? The key is actually present in [file]`

CodeRabbit may run verification scripts and acknowledge if it was wrong. Refresh the page to see its response.

**General PR comments** (like summaries of multiple issues) are fine for human reviewers but CodeRabbit responds better to inline thread replies.

### Amazon Q Developer

AWS-powered code review bot.

**How to interact:**

```text
/q {message}
```

**IMPORTANT**: The `/q` command must be at the START of the comment, not appended to other text.

**Common commands:**

| Command | Description |
|---------|-------------|
| `/q review` | Request a code review |
| `/q dev` | Ask Q to implement something |
| `/q {question}` | Ask a question about the code |

**Where to use:** In PR comments. The `/q` must be at the beginning of the comment.

#### Resolving Amazon Q Comments

Unlike CodeRabbit, Amazon Q does **not** automatically resolve its comments when you push fixes. You have two options:

1. **Manually resolve**: Click "Resolve conversation" on each fixed issue in GitHub
2. **Reply to dismiss**: Reply to the comment explaining why the fix is valid or why it's a false positive

**Note**: Amazon Q comments are often about potential issues that may already be mitigated. Check carefully before dismissing:
- If the concern is valid, fix it
- If it's a false positive (e.g., "SQL injection" when using Drizzle parameterization), reply explaining why
- If the mitigation exists elsewhere (e.g., UUID validation before interpolation), reply with the location

**Resolving via gh CLI:**
```bash
# GitHub doesn't support resolving review comments via API directly.
# You must manually resolve in the GitHub UI or reply to the thread.

# To reply explaining a fix:
gh api "repos/{owner}/{repo}/pulls/{pr}/comments" -X POST \
  -F in_reply_to={comment_id} \
  -f body="Fixed in commit abc123. Added validation before interpolation."
```

## When to Use Review Bots

- **Clarify feedback**: Ask the bot to explain its suggestion
- **Challenge false positives**: If a bot flags something incorrectly, ask it to verify
- **Request re-review**: After addressing feedback, ask for another pass
- **Get summaries**: Useful for large PRs

## Bot Limitations

- Bots may not see your reply immediately - give them a minute to respond
- Bots can make mistakes - verify their suggestions against actual code
- Bots don't have full context of project history or verbal agreements
- Some suggestions are stylistic preferences, not hard requirements
