# Emily's first-attempt practice

`emily-practice.js` retains the earliest known graded answer for each activity /
question ID. A wrong first choice remains wrong-first evidence after checking,
reopening or correcting it. A correct first choice is not reclassified because
of a later wrong change. Writing is ungraded and excluded. Existing answers with
an unknown original attempt are not guessed to be first answers.

The normal learning journal captures this evidence for Emily's worksheets,
Shopkeeper, Cupcake, Parcel, Rainbow and the new adaptive challenge. The full journal retains each generated question’s original answer. The compact
review catalog keeps one representative wrong-first adaptive item per skill,
rather than an ever-growing duplicate of the journal in the size-limited
progress snapshot. It is separate from the pending event queue, so acknowledging an
upload does not erase it. It is included in the existing private Emily snapshot
as `firstAttempts`; `nextChallenge` retains the current generated activity.
Cloud merges keep the earlier first answer, rather than the latest correction.
No Worker, schema or service configuration change is required.

The My Next Challenge link creates one practice question per recorded wrong-first
knowledge point. Supported skills have alternate prompts; unusual knowledge
points reuse the original item rather than replacing it with unrelated work.
Every generated item has a new question ID, and its own first answer is recorded.
The challenge is saved locally before cloud sync and resumes on reload. Once
all questions are checked, a new challenge can be generated. Records of original
mistakes are retained even after a follow-up is correct; this first version does
not claim that one later correct answer proves mastery.

When private history is unlocked, the generator also attempts to backfill from
the recorded event journal. An earlier import with an unknown first attempt is
not converted into a known mistake. If that history cannot be reached, only
locally known evidence is used. Previously unrecorded first answers cannot be
reconstructed. Existing worksheet learning-history behavior is unchanged.

Jason's roadmap now has four subject entries: Math, English, Thinking Skills and
Music. Existing reading sets are nested under English. Thinking Skills has an
explicit coming-soon panel until a question set is supplied; no fake activity or
progress is created.

## The Lost Friendship Star

`emily-pony.html` is a six-chapter, twelve-question pony adventure with no timer. It uses the parent-approved revised inference, vocabulary, flexible partitioning, quarter-length, graph and simple map questions. It awards six story gems and shows progress on a consistent five-star scale on Emily’s adventure hub. The optional ending asks for two sentences about helping a pony.

`pony-progress.js` merges the latest answer per question, earliest known first answer, completed questions, hints and the latest writing draft. The private progress snapshot stores this in its `pony` field using existing authenticated D1 sync; no Worker or schema changes are needed. Pages without the pony library preserve that snapshot extension. Cloud access still requires an unlocked parent session. Local work remains available if offline or locked.

The existing private learning journal records each answer, hint, active question time, completion and writing changes, with question wording, choices, story and diagram descriptions. First-wrong knowledge points join My Next Challenge, even after a correct retry. Historical unknown first answers are not inferred. The story gems are separate from the five progress stars.

Validation: 128 automated tests pass. Chromium completes all twelve questions on a 390px screen, verifies wrong-then-correct retention, journal completion/writing events and writing restoration after reload. All verification uses synthetic local records, with external network requests blocked.
