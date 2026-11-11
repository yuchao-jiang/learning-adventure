# Family privacy

Learning pages and source code are public. After the private-storage setup in
[cloudflare/SETUP.md](cloudflare/SETUP.md) is complete, cloud learning records
are stored in a private Cloudflare D1 database. The Worker requires the parent
passphrase for both reads and writes. It no longer writes answers into GitHub.
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

A parent can delete records from D1 (`DELETE FROM progress WHERE child = ...`),
clear site data on each device, and remove any local/exported backups. Check
Cloudflare's backup/Time Travel retention and logging settings as well. Revoke
or rotate the family passphrase when access should be removed; this does not
remove records already downloaded onto a device.
