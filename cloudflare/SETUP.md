# One-time setup for family cloud saving

The website still saves locally until the Worker URL is configured. Do not put the PIN or GitHub token in public website files.

1. In GitHub, create a **fine-grained personal access token** limited to repository `yuchao-jiang/learning-adventure`, with **Contents: Read and write** permission. Store it privately; never commit it.
2. Sign in to Cloudflare, go to **Workers & Pages**, create a Worker, and paste/deploy the code from `cloudflare/worker.js`.
3. In the Worker's **Settings → Variables and Secrets**, add encrypted secrets `GITHUB_TOKEN` (the token from step 1) and `FAMILY_PIN` (a private family PIN, preferably long and not reused elsewhere). Optionally set `ALLOWED_ORIGIN` to `https://yuchao-jiang.github.io`.
4. Copy the Worker HTTPS URL (for example `https://your-worker.your-subdomain.workers.dev`) and edit `cloud-config.js`: `window.ADVENTURE_SYNC_URL = 'https://your-worker.your-subdomain.workers.dev';`.
5. Wait for GitHub Pages to publish, then test with a nonessential answer: Save on device A and Continue on device B.

**Important:** A shared PIN alone does not provide strong protection against repeated guesses. Before regular use, configure Cloudflare rate limiting/WAF for the Worker (particularly POST requests), or use stronger authentication. The Worker never puts the GitHub token or PIN in public website code. JSON files under `data/` are public once saved. Every cloud save creates a GitHub commit. Avoid simultaneous edits: saving from one device after another may overwrite older progress; check before saving.

Cloud loading automatically happens only on a device with no local answers; when local answers exist, tap **Continue My Adventure** to choose whether to replace them. Existing local progress is not deleted during setup.
