# Music Island

Open `piano.html?learner=emily` or `piano.html?learner=jason`. Links also appear on
both learner roadmaps and the home page. The page is English, matching the
existing child activities, and adds no parent/admin panel.

- Each child can check in once per browser-local calendar day. Practice type is
  optional (scales, a piece, exploring). All days count cumulatively; gaps do not
  reset anything. There is no competitive ranking or reminder schedule.
- Rewards arrive at 3 (buddy hatches), 5 (dance/flower), 10 (cottage), 15 (violin),
  20 (starlight stage) and 30 (concert) days. Days continue accumulating afterward.
- Days on which both children check in count as shared duet lights. The other
  child's cloud days are loaded through the same authenticated family session.
- The tiny piano is ready to play on the first key tap; the sound button can mute\n  it. Audio starts only after a user interaction and resumes the browser audio\n  context before playing. Audio is generated in the
  browser; there are no audio downloads or outside services. Reduced-motion
  preferences turn off scene animations.

## Private persistence

`piano-progress.js` stores versioned daily records under
`adventure-piano-v1:emily` and `adventure-piano-v1:jason`. Each row contains its
local calendar-day key, UTC save timestamp and optional practice types. Same-day
merges retain one check-in and union the selected practice types.

`piano-sync.js` reuses the configured sync URL and existing trusted-device/tab
session. It accepts the current private D1 and optional private GitHub protocol
markers. No Worker, schema, repository token, secret or deployment setup change
is required. When cloud access is locked or offline, check-ins remain local;
cloud sync retries on focus, reconnect and periodic checks while the page is
visible. Existing parent cloud access can be unlocked on the learner roadmap.

Piano is saved as the `piano` JSON-string field in each existing learner snapshot.
Saving a piano record retains every other snapshot field. Learning-page saves
retain the latest remote piano field, including for Emily, so switching activities
cannot discard piano progress. Optimistic revision conflicts refetch and merge
before retrying. Saving does not succeed visibly when local storage fails.
