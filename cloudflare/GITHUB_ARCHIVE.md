# Archive every learner record to private GitHub

For automatic Notion learning records, start with [NOTION_SYNC.md](NOTION_SYNC.md). Notion sync works directly from D1 and does not require a GitHub token. This GitHub archive can be activated independently when wanted.

Destination: `yuchao-jiang/learning-records`, branch `main`. This Worker update keeps D1 as the operational store and automatically queues every successful progress revision and every learning-history event. SQLite triggers put records in the outbox in the same transaction as their save. Old progress and existing event history are queued on first upgrade. Already missing or never-recorded history cannot be reconstructed.

## One-time activation

1. Merge this PR, then deploy the updated `cloudflare/worker.js` to the existing sync Worker. Keep `PROGRESS_DB`, `FAMILY_PASSPHRASE` and the existing origin configuration.
2. Create a fine-grained GitHub token owned by the repository owner, restricted to **learning-records only**, with **Contents: read and write** (Metadata read is included). Add it as a Cloudflare **secret** named `GITHUB_ARCHIVE_TOKEN`. Do not paste it into chat or put it in public repository files or browser code. Repository and branch are fixed by the Worker, not taken from a request.
3. Under the Worker’s Triggers, add a Cron Trigger `*/5 * * * *` to retry pending archives even when nobody has a learning page open. The `scheduled` handler is included. Authenticated learner requests also trigger background retries.

No new database binding or manual SQL migration is needed: the Worker creates the archive queue, triggers and state table automatically after authentication. The original D1 progress/history tables must already exist from the current setup. Existing device sessions keep working. GitHub writes are not active until the deployed Worker has the secret.

The Worker requires GitHub to report that the destination repository is private before uploading any record content. Keep it private. If GitHub becomes unavailable, permission expires or the repository becomes public, D1 saves continue and the archive queue remains pending. Do not infer an empty queue means records that never reached the Worker were saved: offline browser-only records still need their existing authenticated cloud sync.

## Repository layout

- `<learner>/progress/snapshots/<revision>.json`: every successful cloud snapshot, including reading, maths, thinking skills, pony/Garden Club activity fields, writing and piano check-ins present in the save. Revisions are preserved, not replaced by a single latest file.
- `<learner>/activities/<activity>/<practice>/events/<id>.json`: immutable raw answer changes, checks, hints, views, estimated active time, flags, starts/completions, imports and parent notes recorded by the website.
- `<learner>/piano/check-ins.md`: readable practice dates and saved practice items; raw snapshots retain the full piano state.
- `<learner>/activities/<activity>/<practice>/report.md`: readable question/context/choice summaries with first recorded and latest answers, known right/wrong results, estimated viewing time, hints and parent observations. Unknown values are omitted; imported history is identified.

GitHub updates use a single commit per batch, retain unrelated repository files and retry non-fast-forward conflicts. Queue rows are deleted only after the branch update succeeds. At most 60 queued records are flushed per invocation; cron and subsequent requests continue the remainder. If a process stops after GitHub commit but before acknowledgement, retrying the same deterministic paths does not duplicate events or lose source records.

`GET /archive?child=jason` (or emily) with an existing family session returns `configured`, `pending`, `lastCommit` and destination. `POST` to the same route drains a bounded batch. Both are authenticated. A configured token does not prove the token is valid or that an upload succeeded: use a successful archive response/commit and inspect actual files. Errors never expose saved content or token values.

## Parent notes shared in chat

Notes supplied to this chat are written to the private repository using the connected GitHub tool, alongside Notion updates where requested. Notion is not automatically scraped or synchronized by this Worker. Record the reporting date separately from an unknown practice date. Do not claim the notes are archived until the GitHub write is confirmed. This code does not create scheduled ChatGPT reminders or export unrelated Notion content.

## Validation

36 combined Worker tests pass: existing auth, stale-write protection and event immutability, plus atomic archive queueing, both learners, initial backfill, first-wrong/later-right reports, upload failures, private-destination enforcement, authentication and branch-conflict retry. All archive traffic in tests uses a mock GitHub API and synthetic records. No real D1 records or server credentials were accessed during development.
