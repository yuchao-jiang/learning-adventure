# Learning Adventure tests

Run all automated checks with Node.js 20 or newer:

```bash
node --test persistence.test.cjs tests/*.test.cjs
```

No external dependencies are required. The suite covers:

- Local progress restoration, validation, migration and storage failures.
- Jason Maths question structure, timers, score recording and reset behavior.
- Five-slot progress stars, completion labels and Emily's real roadmap rendering.
- Cloud merging, submitted-answer protection, history deduplication and stable reloads.
- Worker origin/PIN checks, stale-save conflicts, Unicode round trips and corrupt saves.

Cloud tests use mock requests and storage; they never write to GitHub or Cloudflare.
GitHub Actions runs the full suite on pushes and pull requests.
