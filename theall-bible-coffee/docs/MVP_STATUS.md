# MVP Status — TheAll Bible Coffee

Last updated: 2026-08-19

This document exists to keep four different things from being confused with each
other. Only the first one is currently true.

| # | Milestone | Status |
| --- | --- | --- |
| 1 | Technical interface complete | ✅ Yes |
| 2 | Final content inserted | ❌ No — both chapters are `draft` |
| 3 | Ready for user validation | ❌ No — blocked by #2 |
| 4 | Preview deployed | ❌ No — no deployment access in the build environment |

Two books are now open: **วิวรณ์ 1** (the camp chapter,
"จะใช้ชีวิตอย่างไรในยุคสุดท้าย") and **เอเฟซัส 1**. Both run through the same
reader, checkpoint, reflection, scoring and feedback flow.

---

## 1. Technical interface — complete

Every item in the technical acceptance criteria is implemented and verified.

| Criterion | Status |
| --- | --- |
| `/th` works | ✅ |
| `/th/books/revelation` and `/th/books/ephesians` work | ✅ |
| `/th/books/<book>/1` works for both books | ✅ |
| Chapters are comfortable to read on a phone | ✅ verified at 320 / 375 / 390 px |
| Read-aloud works and can pause, skip and change speed | ✅ device speech only, nothing uploaded |
| Points are awarded and shown | ✅ 100 per chapter; a wrong answer costs points, not progress |
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
| `pnpm test` | ✅ 43 tests pass |
| `pnpm build` | ✅ passes, all nine routes prerendered |
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

Both `content/books/revelation/th/chapter-01.json` and
`content/books/ephesians/th/chapter-01.json` have `"status": "draft"`. Each
chapter page shows a draft banner while that is true.

The technical structure is real and complete — all ten required parts are present,
in order, with genuine Thai prose. What is missing is editorial verification, and in
one case genuine source material.

### The SCRM case study cannot be generated

The house standard asks each chapter to open with a **real** person, named, with a
real place and a real time. That material cannot be invented — inventing a named
person, town and date and presenting it as fact would be fabrication, so it was not
done. Instead:

* the schema now has a first-class `caseStudy` block with required `person`,
  `place`, `when`, and a `verified` flag that the validator **refuses** to accept as
  true without an attached source;
* both story sections carry a clearly-labelled placeholder that states in Thai that
  it is not a real person's story and must be replaced;
* the reader UI prints "ฉบับร่าง — ยังรอเรื่องจริง…" under any unverified case study.

The same applies to research findings and quotations. The `research` and
`quotation` block types exist and require a citation and a source id, but no
research and no quotes were written, because none could be verified. The KPI of
500 examples and 1,000 quotes is a content-supply job with a verification gate now
built for it — it is not something the code can conjure.

### Blockers

| # | Blocker | Where | What is needed |
| --- | --- | --- | --- |
| B1 | **The real-life story is a placeholder in both books.** Each is an explicitly labelled placeholder, not an account of a real person. | `revelation-01-story`, `ephesians-01-story` | A real, verified story per chapter, named, placed and dated, used with the subject's permission. |
| B2 | **Bible text is reference-only in both books.** No Thai translation rights have been supplied, so the app shows the reference and asks the reader to open their own Bible. | `mainVerse` in both chapters | Written permission from a Thai translation's rights holder, or a decision to stay reference-only. The schema blocks adding text until `rightsStatus` is `licensed`. |
| B3 | **Greek explanations are unreviewed.** Terms are drawn from the chapters themselves, but the glosses have not been checked against a standard lexicon. | `greek-terms`, `greek-terms-rev` | A reviewer who reads Greek to confirm each gloss, then flip that source to `verified`. |
| B4 | **Historical claims lack citations.** The Artemis temple background, the Ephesians 1:1 manuscript note, and the Roman-Asia social pressure note are stated without scholarly references. | `artemis-ephesus`, `eph-1-1-variant`, `roman-asia` | Add verifiable references, or remove the claims. Both are surfaced to readers as "รอการตรวจสอบ". |
| B5 | **The theological message has not been reviewed.** | both chapters | A pastoral/theological reviewer signs off on the central truth and the application section. |

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
| Final-quality Thai content inserted (both books) | ❌ B1–B5 |
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

Unwritten chapters appear on each overview page as a quiet, clearly-marked outline
("ยังไม่เปิดให้อ่าน") for orientation only. They are not links and have no pages.

The 66-book library, streaks, and any leaderboard remain out of scope. Points are
per chapter, shown as a single number, and never ranked against another reader.

---

## Next single action for the project owner

**Supply one real, permitted case study for วิวรณ์ 1** — a named person, a real
place, a real time, and permission to publish it. That is the only blocker the code
cannot solve and the only one that stops the camp chapter being handed to readers.
Everything else on the list is review work that can be done in an afternoon once
that story exists.
