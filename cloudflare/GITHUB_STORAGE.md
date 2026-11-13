# Store learning records in the private GitHub repository

This is an optional replacement for D1 **learning storage**. It reuses the
existing sync Worker and website. Do not create another app, repository or
Worker. Existing parent authentication remains unchanged: D1 is still used for
`device_sessions` and `auth_attempts`, not learning records in GitHub mode.

## What goes where

- The public `learning-adventure` repository contains website code only.
- Private `learning-records/private-data/progress/emily.json` and `jason.json`
  contain each learner's cloud progress snapshot, including maths attempts.
- Private `learning-records/private-data/history/<learner>/index.json` and
  immutable `batches/*.json` contain answer changes, checks, flags, question
  metadata and estimated active time. Numeric ingestion cursors preserve late
  offline events even when their timestamps are older than previous events.
- Human-readable notes and Markdown reports remain in the private repository's
  `jason/` and `emily/` folders. Automatic data commits preserve these files.
  This change does not itself generate new Markdown reports: chat can read the
  saved JSON records and combine them with parent notes to prepare report PRs.

The browser never receives a GitHub token. It continues using the same
HTTPS Worker URL and authenticated reads/writes. The Worker verifies the
configured destination is private before every learning request. No fallback
writes to D1 or a public repository occur when GitHub is unavailable.

## One-time setup

1. Merge the website/backend PR and let GitHub Pages finish deploying. Refresh
   the learning pages so they accept the new `private-github-v1` response marker.
   **Do not change storage mode yet if you need to migrate existing D1 records.**
2. In GitHub, open **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**. Select your own account as resource
   owner, **Only select repositories → learning-records**, and **Repository
   permissions → Contents: Read and write**. Metadata read access is automatic.
   Set an expiry you can renew. The token does not need access to the public site
   repository or account administration.
3. Open the **existing** Cloudflare sync Worker → **Settings → Variables and
   Secrets**. Add **Secret** `LEARNING_GITHUB_TOKEN` using the token. Never put
   this token in website code, a GitHub issue, a commit, or chat.
4. Add the ordinary Worker variables:

   | Variable | Value |
   | --- | --- |
   | `LEARNING_GITHUB_REPOSITORY` | `yuchao-jiang/learning-records` |
   | `LEARNING_GITHUB_BRANCH` | `main` |
   | `LEARNING_STORAGE` | `d1` initially; `github` after the export below |

5. Keep `FAMILY_PASSPHRASE`, `ALLOWED_ORIGIN`, `PROGRESS_DB` and the existing D1
   binding. Replace the existing Worker's source with the complete updated
   `cloudflare/worker.js` and deploy it. It is still one self-contained file.
   With `LEARNING_STORAGE=d1`, learning storage stays as it was.

The private repo needs an initial commit (its README is enough), and the chosen
branch must permit this token to create commits. Automatic data sync commits
write directly to that branch. Existing chat-created report PRs remain separate.
If a branch rule prevents direct writes, use a dedicated existing branch in this
same private repo and set `LEARNING_GITHUB_BRANCH` accordingly; do not weaken
rules for unrelated repositories.

## Copy existing records without losing them

Do this during a break, with the learning pages closed on every device. Otherwise
an old tab could save new work during the export. Keep the family passphrase out
of command history by reading it into an environment variable on a trusted
computer. Never paste it into chat.

In a local checkout of `learning-adventure`, with Node.js 22 or newer:

```sh
export ADVENTURE_SYNC_URL='https://learning-adventure-sync.jiang-yuchao0.workers.dev'
read -rsp 'Family passphrase: ' FAMILY_PASSPHRASE
export FAMILY_PASSPHRASE
node scripts/migrate-private-github.cjs export .private-backup/d1-before-github.json
```

The export contains both learners' snapshots and all paginated history. It is
created with private file permissions and refuses to replace an existing file.
Keep a second private backup. The existing `learning_events` table must already
be configured; an incomplete export fails rather than silently omitting history.

Now change only the Worker's `LEARNING_STORAGE` variable to `github` and deploy.
Keep the public website URL and `cloud-config.js` endpoint unchanged. Then run:

```sh
node scripts/migrate-private-github.cjs import .private-backup/d1-before-github.json
node scripts/migrate-private-github.cjs verify .private-backup/d1-before-github.json
unset FAMILY_PASSPHRASE
```

The import refuses to replace different existing destination progress. Retrying
an identical import is safe; history IDs are deduplicated and conflicting content
is rejected. Verification checks actual progress contents and every exported
event, including Unicode writing. The script prints no answers or credentials.
An error does not delete the backup or D1 data. Keep learners paused until both
commands succeed, then reopen/reload the learning pages and check saved work.

**Nothing deletes D1 learning records automatically.** After checking both
learners' progress, history and backups, old `progress`/`learning_events` rows can
be retained as a private backup or removed separately. Do not delete the login
session or failed-login tables. Switching back to D1 later would expose the old
D1 snapshot; it is not an automatic reverse migration.

## Sync behavior and limits

Progress still saves automatically through the Worker. Detailed history is
batched at most once a minute in GitHub mode, so new history may not appear in
the repository immediately. Queued events remain in local browser storage until
GitHub acknowledges them, and retry on reconnect/focus/periodic sync. Do not clear
browser data before pending work has uploaded. A browser/process closing before
its local work syncs cannot guarantee cross-device availability.

Each history upload adds one batch file and updates its index in one Git commit.
Concurrent branch edits use non-force, fast-forward updates with bounded retries;
stale progress cannot overwrite a newer snapshot. GitHub rate limits, token
expiry or a public destination cause requests to fail closed; existing local
work is retained. GitHub is suitable for this family's small volume of records,
not a high-volume analytics database. Its commit history retains earlier data;
removing a current file alone does not erase those prior versions.

Only records captured since tracking was enabled can contain detailed timing or
answer changes. Migration cannot recreate unrecorded older data. Question time
is estimated active viewing time, not exact thinking time.
