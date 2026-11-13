# Family privacy

Learning pages and source code are public. After the private-storage setup in
[cloudflare/SETUP.md](cloudflare/SETUP.md) is complete, cloud learning records
are stored in a private Cloudflare D1 database by default. The optional
[private GitHub mode](cloudflare/GITHUB_STORAGE.md) stores learning snapshots and
answer/timing events in the private `learning-records` repository; D1 then holds
only active login sessions and failed-login tracking. Existing D1 learning
records remain until separately removed after migration verification. The Worker requires
authentication for both reads and writes. A parent uses the passphrase to
create a tab session or optionally remember a family device for 30 days. Only
an opaque, revocable token is saved in browser storage; the server stores its
secret-bound hash and expiry. The passphrase is never saved in browser storage. The Worker never writes answers into the public website repository. In private
GitHub mode it requires a server-side token restricted to the private records
repository and checks that destination is private before reading or writing.
Until deployment and historic cleanup are complete, earlier public records
remain accessible in Git history. Disabling cloud sync does not erase them.

The data includes selected answers, writing, notes, scores, completion, and
submission/save timestamps. The Worker also briefly stores secret-salted client
identifier hashes for incorrect-login rate limiting. GitHub and Cloudflare may
retain their normal service/access logs. There are no advertising or analytics
scripts in this project.

Use aliases on public pages if the children's names should not be associated
with the repository owner's account. Avoid writing school, address, contact,
medical, or other identifying information in activities. Local browser storage
is not encrypted and is visible to people using the same browser profile.

In D1 learning-storage mode a parent can delete records from D1 (`DELETE FROM progress WHERE child = ...`),
use Lock cloud or Forget all trusted devices to revoke sessions, clear site data on each device, and remove any local/exported backups. Check
Cloudflare's backup/Time Travel retention and logging settings as well. Revoke
or rotate the family passphrase when access should be removed; this does not
remove records already downloaded onto a device.


In private GitHub mode, records are versioned files in the private repository.
Access is available to its collaborators and configured repository integrations.
Deleting a current file does not remove its Git history; backup, retention and
history removal require separate consideration. Keep the records repository
private and never enable public hosting for its data. Chat reports and parent
notes are stored there as Markdown, not in the public website repository.
