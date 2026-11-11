# Learning Adventure

Public English and Maths learning pages for the family. Open `index.html` to
choose an adventure. No website build tools or API keys are needed.

## Publish on GitHub Pages

Publish `main` from the repository root in **Settings → Pages**. Keep the HTML
pages and their accompanying JavaScript files together.

## Progress and privacy

Answers are saved in this browser. Optional cloud progress uses a private
Cloudflare D1 database, with a parent passphrase required for reads and writes.
Cloud sync is disabled in `cloud-config.js` until the private Worker is deployed
and existing progress has been imported. See [cloudflare/SETUP.md](cloudflare/SETUP.md).
Never commit learner records, passphrases, private exports, or API tokens.

Earlier progress files remain in Git history until the separate historic cleanup
is completed. See [PRIVACY.md](PRIVACY.md) for data and deletion details and
[TESTING.md](TESTING.md) for automated checks.
