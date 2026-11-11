# Learning Adventure tests

Run all automated checks with Node.js 22.13 or newer (the Worker tests use built-in SQLite):

```bash
node --test persistence.test.cjs tests/*.test.cjs
```

No external dependencies are required. The suite covers:

- Local progress restoration, validation, migration and storage failures.
- Jason Maths question structure, timers, score recording and reset behavior.
- Five-slot progress stars, completion labels and Emily's real roadmap rendering.
- Cloud merging, submitted-answer protection, history deduplication and stable reloads.
- Worker authentication for GET and POST, failed-login throttling, atomic private
  database writes, stale-save conflicts, body limits and Unicode round trips.
- Locked-browser behavior, cancelled unlocks and rejection of legacy public endpoints.
- Remembered-device expiry, token hashing, per-device/all-device revocation and
  passphrase rotation; no stored parent passphrase.
- Private migration exports and non-overwriting imports.

Cloud tests use mock requests and storage; they never write to GitHub or Cloudflare.
GitHub Actions runs the full suite on pushes and pull requests.
