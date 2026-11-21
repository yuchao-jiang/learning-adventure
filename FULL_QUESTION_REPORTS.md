# Standalone learning reports

Reports for both children include the question, options, reading/story context, claims, and available diagrams alongside recorded answer evidence. Piano records preserve check-in dates and chosen practice items; no exam questions or duration are invented for piano.

`report-catalog.js` contains public question content only. `scripts/build-report-catalog.cjs` builds it from the website's data and HTML, generates static maths diagram assets, and embeds the same catalog in the single-file Cloudflare Worker. Run `node scripts/build-report-catalog.cjs` after changing a fixed activity's questions. Review generated changes with the activity change. Newly generated personalised questions keep their actual prompt and context in their recorded events.

The recorder saves a complete question snapshot when possible. Recorded snapshots take precedence. The server fills missing static context only if the recorded prompt matches the current catalog; it does not replace a different historical question. Missing answers, first attempts, timings and independence are never reconstructed from the question catalog.

The Worker writes full context in private GitHub Markdown and the Notion session report. Native diagram blocks in Notion carry an explicit generated marker and are refreshed idempotently; parent-written blocks, observations and Support properties are untouched. Images are public question diagrams, never children's answers or notes. Selected questions with no answer event are included only when the session explicitly identifies its selected question IDs.

On the first request after deployment, existing event sessions are queued once for report refresh. This changes reports, not source answers or their dates. It requires the existing Notion token/data source settings; optional GitHub exports require the existing private archive token. Deploy the complete updated `cloudflare/worker.js` after merging and keep existing bindings and secrets. No new SQL or database binding is required. Question assets become available when GitHub Pages deploys the merged source.

Manual parent reports and the current question reference library can be updated in Notion immediately through chat. The library is reference material, not evidence of an attempt. Original legacy question variants that were never saved remain unavailable. Worker deployment and production D1 contents are not verified by local tests.

Validation: `node tests/worker.test.cjs` and `node --test tests/report-context.test.cjs`.
