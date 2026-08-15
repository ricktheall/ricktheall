# MVP Status — TheAll Bible Coffee

Last updated: 2026-08-15

This document exists to keep four different things from being confused with each
other. Only the first one is currently true.

| # | Milestone | Status |
| --- | --- | --- |
| 1 | Technical interface complete | ✅ Yes |
| 2 | Final content inserted | ❌ No — content is `draft` |
| 3 | Ready for user validation | ❌ No — blocked by #2 |
| 4 | Preview deployed | ❌ No — no deployment access in the build environment |

---

## 1. Technical interface — complete

Every item in the technical acceptance criteria is implemented and verified.

| Criterion | Status |
| --- | --- |
| `/th` works | ✅ |
| `/th/books/ephesians` works | ✅ |
| `/th/books/ephesians/1` works | ✅ |
| Ephesians 1 is comfortable to read on a phone | ✅ verified at 320 / 375 / 390 px |
| Coffee Cup progress works | ✅ fills 0→90% while reading, 100% on completion |
| Maximum progress persists after refresh | ✅ covered by tests and the smoke test |
| Resume behaviour works | ✅ offers the section the reader left off at |
| Checkpoint works | ✅ 3 Words Check, client-validated, shuffled options |
| Reflection completion works | ✅ required, non-graded, never stored or transmitted |
| Completion reaches 100% | ✅ |
| Feedback can be completed and copied | ✅ with a manual-copy fallback |
| Theme controls work | ✅ light / dark / system, no flash on load |
| Font-size controls work | ✅ four steps, applied to body copy |
| Reset works safely | ✅ confirmation required; removes only this app's key |
| No serious console errors | ✅ the smoke test fails on any console error |
| `pnpm lint` | ✅ passes |
| `pnpm typecheck` | ✅ passes |
| `pnpm validate:content` | ✅ passes |
| `pnpm test` | ✅ 33 tests pass |
| `pnpm build` | ✅ passes, all five routes prerendered |
| `pnpm test:e2e` | ✅ full journey passes on a mobile viewport |
| Preview URL provided | ❌ see section 4 |
| Deployed flow smoke-tested on mobile and desktop | ❌ blocked by section 4 |

### Accessibility

Keyboard-operable controls with visible focus rings, semantic landmarks and heading
order, labelled form fields, `role="alert"` validation errors, live-region
announcements for the checkpoint result and chapter completion, touch targets at or
above 44 px, no horizontal scrolling at 320 px (verified, including at the largest
font size), reduced-motion respected, and progress never conveyed by colour alone.

Not yet done: a manual pass with a real screen reader (VoiceOver / TalkBack) and a
formal contrast audit of every token pair. Neither blocks user testing, but both
should happen before a public launch.

---

## 2. Final content — NOT inserted

`content/books/ephesians/th/chapter-01.json` has `"status": "draft"`. The chapter
page shows a draft banner while that is true.

The technical structure is real and complete — all ten required parts are present,
in order, with genuine Thai prose. What is missing is editorial verification, and in
one case genuine source material.

### Blockers

| # | Blocker | Where | What is needed |
| --- | --- | --- | --- |
| B1 | **The real-life story is a placeholder.** The section is an explicitly labelled hypothetical scenario, not an account of a real person. | `ephesians-01-story` | A real, verified story used with the subject's permission — or a decision to keep a clearly labelled illustration permanently. |
| B2 | **Bible text is reference-only.** No Thai translation rights have been supplied, so the app shows `เอเฟซัส 1:3–14` and asks the reader to open their own Bible. | `mainVerse`, `ephesians-01-main-verse` | Written permission from a Thai translation's rights holder, or a decision to stay reference-only. The schema blocks adding text until `rightsStatus` is `licensed`. |
| B3 | **Greek explanations are unreviewed.** The six terms are drawn from Ephesians 1 itself, but the glosses have not been checked against a standard lexicon. | `ephesians-01-explanation`, source `greek-terms` | A reviewer who reads Greek to confirm each gloss, then flip that source to `verified`. |
| B4 | **Two historical claims lack citations.** The Artemis temple background and the Ephesians 1:1 manuscript note are stated without scholarly references. | source `artemis-ephesus`, `eph-1-1-variant` | Add verifiable references, or remove the claims. Both are surfaced to readers as "รอการตรวจสอบ". |
| B5 | **The theological message has not been reviewed.** | whole chapter | A pastoral/theological reviewer signs off on the central truth and the application section. |

Nothing here was fabricated to fill a gap: no invented story is presented as true, no
statistics, no quotations, no citations, and no claimed Bible-translation permission.
Where material was unavailable it is marked as draft or unverified rather than
guessed at.

### Clearing this section

Once B1–B5 are resolved:

1. Set `"status": "final"` in the chapter JSON.
2. Set the relevant `sources[].status` to `"verified"`.
3. Run `pnpm validate:content` — it warns while the status is not `final`.
4. Confirm the three checkpoint words still appear in the final visible text. The
   content gate and the test suite both enforce this, so a rewrite that drops a word
   fails the build rather than shipping a broken checkpoint.
5. Re-read the reflection question against the final chapter.

---

## 3. Ready for real-user validation — NO

Against the readiness checklist:

| Requirement | Status |
| --- | --- |
| Final-quality Thai Ephesians 1 content inserted | ❌ B1–B5 |
| Main theological message reviewed | ❌ B5 |
| Real-life story verified | ❌ B1 |
| Research and quotations sourced | ❌ B4 |
| Greek explanations checked | ❌ B3 |
| Bible text legally supplied or reference-only | ⚠️ reference-only, which is compliant — confirm this is the intended reader experience |
| Correct checkpoint words appear in final visible content | ✅ enforced automatically |
| Reflection question matches the final chapter | ⚠️ matches the draft; re-check after content is final |
| Mobile reading manually checked | ✅ locally, at 320/375/390/768/1280 px |
| No placeholder content remains | ❌ B1 |
| Deployed URL works on a real phone | ❌ section 4 |

**Do not hand this link to a reader yet.** The interface is ready for them; the
chapter is not.

---

## 4. Preview deployed — NO

The build environment for this work has no Vercel credentials and no Vercel CLI, so
no deployment was attempted and **no preview URL exists**. The code is deployable as
it stands; nothing is stubbed.

To deploy, follow the "Deploying" section of the README. The one setting that is easy
to miss: this app is a package in a pnpm workspace, so Vercel's **Root Directory must
be `theall-bible-coffee`**.

---

## What was deliberately not built

Supabase, authentication, accounts, a database, magic links, English or Chinese
content, a language switcher, Armor / Tree of Life / Path of Light progress, streaks,
a dashboard, public profiles or sharing, server-side checkpoint validation, an
analytics platform, a CMS, payments, an AI chatbot, notifications, a full SEO system,
sitemap or `hreflang`, separate policy pages, Ephesians 2–6 as readable content, a
66-book publishing engine, and any "coming soon" control for a feature that does not
exist.

Chapters 2–6 appear on the overview page as a quiet, clearly-marked outline
("ยังไม่เปิดให้อ่าน") for orientation only. They are not links and have no pages.

---

## Next single action for the project owner

**Decide on B1 — the real-life story.** Either supply a real, permitted account for
the `ephesians-01-story` section, or decide that a clearly labelled illustration is
acceptable. That decision is the one blocker that cannot be resolved by review work
alone, and everything else on the list is checkable in an afternoon once it is
settled.
