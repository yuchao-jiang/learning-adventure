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
