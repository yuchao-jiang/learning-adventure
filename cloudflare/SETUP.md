# Private family progress — deployment and migration

The pages remain public. Learner records belong only in the private Cloudflare D1
database, never in the website repository. This change is not active until the
Worker is deployed. `cloud-config.js` intentionally starts with no endpoint so
updated pages cannot save to the legacy public GitHub backend.

## 1. Back up existing progress before removing public copies

On a trusted computer, clone this repository and run the export script using the
last commit that contains public progress:

```sh
node scripts/export-private-progress.cjs d4e52e8cdccdd633bcbc10751d4644b7edea7feb
```

The script reads the two records from Git history and creates
`.private-backup/progress-backup.json` and `.private-backup/private-import.sql`.
These are private files, excluded by `.gitignore`. Keep an additional secure
backup. Do not upload them to GitHub, attach them to a PR, or paste them in chat.
For a later migration, use the full commit SHA containing your latest public
saves. Pause the legacy Worker first so no new saves are missed.

## 2. Create private storage in Cloudflare

1. Open **Storage & databases → D1 SQL Database**, create `learning-adventure-progress`.
2. Open its SQL console and run the SQL from `cloudflare/schema.sql` to create
   `progress`, `auth_attempts`, and `device_sessions`. If you already ran the old
   schema, run the updated schema again; CREATE TABLE IF NOT EXISTS preserves records.
3. Run the contents of the local `.private-backup/private-import.sql` in that
   database's SQL console. It only inserts missing learners; it does not replace
   existing private progress. Confirm there are two rows with
   `SELECT child FROM progress;`. Do not publish query results containing answers.

## 3. Replace the legacy Worker

1. Open the existing `learning-adventure-sync` Worker. Pause access using
   Cloudflare Access or temporarily disable its route while changing it; removing
   the old GitHub token alone does not prevent public reads.
2. Add a **D1 database binding** named `PROGRESS_DB` pointing to the database above.
3. Add an encrypted secret named `FAMILY_PASSPHRASE`: use a unique, randomly
   generated password or long random word phrase of 16–256 characters. A short
   numeric PIN is no longer accepted. Enter it only in Cloudflare and the parent
   unlock prompt on your HTTPS site; never in the repository or chat.
4. Set `ALLOWED_ORIGIN` to `https://yuchao-jiang.github.io`.
5. Replace the Worker source with `cloudflare/worker.js` and deploy it. Both GET
   and POST require authentication, including requests with no Origin header.
   Five incorrect attempts from a client in a minute block further attempts for
   that minute. Database errors fail closed. Add Cloudflare WAF rate limiting
   for protection against distributed attempts and traffic abuse as well.
6. Remove `GITHUB_TOKEN`, `FAMILY_PIN`, and `REPO` from the Worker. Revoke the old
   repository token in GitHub after verifying it is no longer needed elsewhere.
   The new Worker makes no GitHub requests.

## 4. Verify and reconnect the public pages

- Open `https://<worker-url>/?child=emily` without credentials: it must return
  401, with no learner records. Check Jason too. Repeat with a wrong passphrase.
- Confirm an authenticated GET returns `storage: "private-d1-v1"` and your
  imported progress. Never put the passphrase in a URL or shell history.
- Set `window.ADVENTURE_SYNC_URL` in `cloud-config.js` to the deployed HTTPS
  Worker URL and commit that public URL. There are no credentials in this file.
- After GitHub Pages updates, choose **Unlock private cloud progress**, enter the
  parent passphrase, and confirm progress on both learners before saving.
- Make a nonessential change on one device, save, then unlock on another device.
  Check that the progress synced and that no GitHub data commit was created.
- Use **Lock cloud** to revoke this device token and remove its browser copy.
  A parent can use **Forget all trusted devices** to revoke every session. Both
  actions leave progress already on each device intact. Clear site data before
  sharing a device.

The shared passphrase unlocks both learners. The browser uses the parent passphrase only to create or revoke sessions; it is never
saved in browser storage. By default an opaque token stays in tab sessionStorage
for up to 12 hours. With the unchecked-by-default **Remember this trusted device
for 30 days** option, a token stays in localStorage until its fixed 30-day expiry.
The server stores only secret-bound token hashes, and rotating the parent
passphrase invalidates existing tokens. Anyone using a remembered browser can access both learners until the token
expires or is revoked. Choose this only on a family device. A stolen token grants
cloud access until expiry/revocation; scripts on the same site can read browser
storage. If a revocation request fails offline, the browser forgets its copy but
the server token remains valid until expiry or a successful parent revocation. Local answers remain readable on the device, even while the cloud
is locked. Private storage restricts public access; this is not end-to-end
encryption and Cloudflare account administrators can access the records.

## 5. Remove historic public copies

This PR removes `data/emily.json` and `data/jason.json` from the current tree,
and blocks accidental recommits of data JSON. Old commits still contain them.
After checking the private migration, remove those paths from **all Git refs**
with a reviewed `git-filter-repo` history rewrite and coordinate replacement of
existing clones. GitHub cached views and PR references may require a GitHub
Support removal request. Forks/downloaded copies cannot be recalled.

Do not force-push rewritten history until the private backup and database are
verified. Deleting the current files or making new commits alone is not erasure.

## Trusted-device session endpoints

The browser POSTs `{ "remember": true|false }` to `/session` with the parent
passphrase in the `X-Family-Pin` header. The response supplies a random 256-bit
bearer token and an absolute `expiresAt` timestamp. Reads and saves send that
token via `Authorization: Bearer ...`, never in a URL. No passphrase is stored.

DELETE `/session` with that bearer token revokes only that session. DELETE
`/sessions` requires the parent passphrase and revokes every session. Expired,
revoked, and pre-passphrase-rotation tokens receive 401. Temporary tab tokens
expire after 12 hours; remembered tokens expire after 30 days without extension.
Run the updated schema before deploying the updated Worker. Keep the configured
Worker URL at its root (no extra path).
