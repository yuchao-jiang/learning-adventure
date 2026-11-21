# Automatic learning records in Notion

This adds direct D1 → Notion updates. GitHub archiving remains optional and independent: Notion does not depend on GitHub files or a GitHub token. D1 continues to save the website’s operational records. Both sync destinations use durable queues and the same existing Worker.

## Destination already prepared

Parent dashboard: https://www.notion.so/41d230cdb84f8168bc99e80f6f53da96

Learning Sessions database: https://www.notion.so/41f230cdb84f8138944ddf7fa6436026

Data source ID (not the database page ID): `41f230cd-b84f-816e-bed1-000bcae224e4`.

The main view shows Session, Child, Started, State and Parent observations. A second view exposes scores, question count, estimated active seconds and support. Each session page contains automatically updated question results. Existing planning cards, goals and parent observations are retained; old notes with no known attempt ID are not silently linked to a different practice.

## One-time activation

1. Create a dedicated Notion API internal connection in the correct workspace with read/insert/update content capabilities. Give it access to Learning Sessions (or the containing parent dashboard if Notion requires inherited access). A supported Notion API personal access token also works, but prefer a dedicated connection with narrow page access. Follow the current Notion developer portal workflow: https://developers.notion.com/guides/notion-api/quick-start . The chat’s existing OAuth connection is not a reusable background credential for Cloudflare.
2. In the existing Cloudflare Worker, add **secret** `NOTION_SYNC_TOKEN` containing that connection’s API token. Add the plain variable `NOTION_DATA_SOURCE_ID` with the exact ID above. Never paste the token into chat, GitHub source or browser code.
3. Deploy this PR’s complete `cloudflare/worker.js` to the existing Worker, keeping PROGRESS_DB and FAMILY_PASSPHRASE. Add/keep Cron Trigger `*/5 * * * *` for retries when learning pages are closed. The same trigger handles optional GitHub archiving too. No new binding or manual SQL migration is required; queues/triggers are initialized automatically against the existing progress/history tables.
4. Open an authenticated learning page and allow its existing save/sync to finish. Check Learning Sessions for real source records. Verify actual rows and question results before treating the connection as live. Background retries can take several runs for a backlog or Notion rate limits.

`GET /notion-sync?child=jason` with an existing family credential shows configured/pending/lastSuccessfulSync. `POST` drains a bounded set of jobs. Opening that URL without the family credential correctly returns an authentication error. Configured does not prove a successful upload.

## What updates automatically

- Recorded learning-history events are grouped by child/activity/attempt, producing one Notion row per practice, with source dates, completion, first/latest known correctness, question/context/choices, hints and estimated active viewing time.
- Writing is kept as text and not automatically marked right/wrong. Imported work does not invent original first-attempt scores. Completion does not establish independent mastery or goal readiness.
- Saved piano check-ins become separate dated practice rows with their recorded practice items. Duration and musical proficiency are not inferred.
- The latest full saved progress snapshot is retained in a separate Saved progress overview, excluded from the main session view. This preserves information where older per-question events were not captured, without inventing dated sessions or scores. A snapshot alone is not equivalent to full historical session evidence.

Only records that reach D1 can be synchronized. Offline/unlocked-device conditions still follow the existing website sync. Missing or never-collected historical answers/timing cannot be reconstructed.

## Parent observations stay safe

The Worker never writes the **Parent observations** or **Support** properties. You may edit them directly or tell this chat what happened and have it update the matching session. Only automatic properties and a specifically marked Website results callout are updated; other page blocks remain untouched. Parent-note events already recorded by the website appear in the generated result details. Chat/Notion observations are not automatically copied into D1 or GitHub by this connection; they are archived through chat’s existing private-repo workflow when supplied here.

## Reliability and validation

D1 triggers create/update jobs transactionally with source saves. Event jobs coalesce revisions rather than upload one page per click. Per-job D1 leases prevent parallel workers from creating the same session simultaneously. A newer revision arriving during upload remains pending. Known page IDs are persisted before block updates, and the Sync ID lookup recovers uncertain creates. Failures retain jobs and leave D1 saving intact. Notion API requests are server-only and target api.notion.com. The API version is pinned to 2025-09-03 for data-source endpoints.

36 Worker tests pass: 28 existing save/archive regressions plus scheduled retry coverage and dated Notion results, first/latest correctness, notes/support preservation, retry after partial creation, newer revisions during upload, piano dates, no unconfigured/unauthenticated uploads and unknown imported first answers. All API calls in tests are mocked and all records synthetic; no live D1 credentials or Notion server token were available. The prepared Notion database is real; automatic production updates are not yet activated.
