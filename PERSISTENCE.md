# Saving progress

The static app stores progress in this browser's `localStorage`. No backend,
account, API key, or build step is required. Keep `persistence.js` alongside
`index.html` when publishing to GitHub Pages.

Answers (including unfinished writing), checked activities, hints, and the
selected subject are saved after each change and restored when reopening the
page at the same origin. The page reports storage failures and remains usable
in memory when storage is blocked or full.

`persistence.js` exposes `AdventurePersistence.createPersistence(getStorage,
questions)` with `load()` and `save(answers, tab)` methods. Injecting storage
makes the module testable without a browser. Version 2 uses the
`emily-adventure-v2` key and validates records against current question IDs and
choice ranges. Existing `emily-adventure-v1` answers migrate automatically;
the original key remains as a recovery copy. Malformed or unsupported documents
are reported and replaced only on the next user change.

Progress does not sync between devices, browsers, or site origins. Clearing site
data removes it; private browsing may discard it when the session closes. Avoid
private information in writing answers on shared devices.

Run the persistence tests with Node.js 18 or newer:

```sh
node --test persistence.test.cjs
```
