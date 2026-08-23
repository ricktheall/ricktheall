# TheAll Bible Coffee — Validation MVP

A single-chapter Thai Bible reading experience, built to answer one question:

> Can an ordinary Thai Christian read Ephesians 1 on a phone, understand its central
> truth, complete one checkpoint, and genuinely want to come back for chapter 2?

This is **not** the production platform. There is no account system, no database, no
analytics. Everything a reader does stays in their own browser.

**Status:** the interface is technically complete; the Ephesians 1 content is still
`draft`. See [`docs/MVP_STATUS.md`](docs/MVP_STATUS.md) for exactly what is and is not
ready.

---

## Routes

| Route | What it is |
| --- | --- |
| `/th` | Thai homepage — the promise, how a chapter works, the disclosure |
| `/th/books/[bookId]` | Book overview and chapter outline |
| `/th/books/[bookId]/[chapter]` | The full chapter reading experience |

Open books are `revelation` (the camp chapter) and `ephesians`, both chapter 1.
`/` redirects to `/th`. The app is Thai-only; the `/th` segment exists so other
locales can be added later without moving these URLs.

Books and their chapters are declared in `src/lib/content/books.ts`. A chapter
only becomes a page when it is marked `available: true` **and** a matching
`content/books/<id>/th/chapter-NN.json` exists.

## Read aloud

Every chapter page carries a read-aloud bar built on the browser's own
`speechSynthesis`. Nothing is uploaded — the device speaks locally. The chapter
is split into one utterance per block so a listener can pause, resume, or skip a
paragraph, and the page highlights and follows whatever is being spoken. Speed is
adjustable (0.8×–1.5×) and stored with the other preferences. Browsers without
speech support show a plain notice instead of broken controls.

## Points

A chapter is worth 100 points: 40 for reading the whole text, 40 for passing the
3 Words Check first try (25 after a wrong attempt), and 20 for the reflection. A
wrong checkpoint answer costs points, never progress. The rules live in
`computePoints` in `src/lib/progress/logic.ts`.

---

## Installation

Requires Node 20+ and pnpm 10+. This package lives in a pnpm workspace at the repo
root, so install from the repository root:

```bash
pnpm install
```

## Commands

Run from the repository root (they proxy into this package), or from
`theall-bible-coffee/` directly.

```bash
pnpm dev               # development server on http://localhost:3000
pnpm build             # production build
pnpm start             # serve the production build
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm validate:content  # schema + checkpoint-word content gate
pnpm test              # Vitest (logic, storage, and end-of-chapter flow)
pnpm test:e2e          # Playwright smoke test of the whole reader journey
```

All five of `lint`, `typecheck`, `validate:content`, `test` and `build` must pass
before a change is considered done.

---

## Replacing the Ephesians 1 content

All chapter content lives in one version-controlled file:

```
content/books/ephesians/th/chapter-01.json
```

It is validated by the Zod schema in `src/lib/content/schema.ts` at build time, in
tests, and by `pnpm validate:content`. Nothing is ever rendered as raw HTML — every
field is drawn as text.

### Structure

```jsonc
{
  "schemaVersion": 1,
  "status": "draft",          // draft | review | final
  "locale": "th",
  "bookId": "ephesians",
  "chapterNumber": 1,
  "title": "…",
  "summary": "…",
  "estimatedMinutes": 18,
  "mainVerse": { … },
  "sections": [ … ],          // ten ordered parts of the chapter
  "checkpoint": { … },
  "reflection": { … },
  "completion": { … },
  "sources": [ … ]
}
```

Section IDs are stable and must not be renamed — stored reading positions refer to
them:

`ephesians-01-main-verse`, `-story`, `-context`, `-outline`, `-explanation`,
`-metaphor`, `-connections`, `-application`, `-checkpoint`.

### Block types

Each section holds an ordered list of blocks. Only the types this chapter needs
exist: `paragraph`, `heading`, `list`, `callout`, `scriptureReference`, `greekTerm`,
`application`. Add a new type by extending the discriminated union in
`src/lib/content/schema.ts` and adding a branch to
`src/components/reader/blocks.tsx` — the `switch` is exhaustive, so TypeScript will
point at anything you miss.

### Bible text and rights

`mainVerse.rightsStatus` is `reference-only`. While it is, the schema **refuses** to
accept `text` or `attribution` — the app shows the reference and nothing else. Once a
translation and its permitted use are supplied in writing:

```jsonc
"mainVerse": {
  "reference": "เอเฟซัส 1:3–14",
  "text": "…",
  "translationId": "…",
  "rightsStatus": "licensed",
  "attribution": "…"
}
```

Never add Bible text without confirmed permission, and never invent an attribution.

### Sources

Every entry in `sources` carries `status: "verified" | "unverified"`. Unverified
sources are labelled "รอการตรวจสอบ" in the chapter footer. Change a status to
`verified` only after a human has actually checked it.

### Marking content ready

Set `"status": "final"` once the content has been reviewed. That removes the draft
banner from the chapter page. `pnpm validate:content` prints a warning while the
status is anything other than `final`.

---

## Configuring the three checkpoint words

The 3 Words Check lives in `checkpoint` inside the same JSON file:

```jsonc
"checkpoint": {
  "options": [
    { "id": "eph-01-word-chosen", "word": "เลือกสรร" },
    { "id": "eph-01-word-sabbath", "word": "วันสะบาโต" }
    // …at least six options
  ],
  "correctOptionIds": [
    "eph-01-word-chosen",
    "eph-01-word-inheritance",
    "eph-01-word-deposit"
  ]
}
```

Rules the tooling enforces for you (`pnpm validate:content` and `pnpm test` both
fail otherwise):

1. `correctOptionIds` must contain exactly three distinct, existing option IDs.
2. Every correct word must literally appear in the reader-visible chapter text.
3. No distractor may appear in the reader-visible chapter text.

Option order is shuffled in the browser on every attempt; the IDs are stable. Choose
distractors that are real, distinct Bible concepts — not spacing, punctuation, or
inflection variants of the correct words.

The reflection question is the `reflection` object in the same file. Keep it pointed
at the chapter's central truth.

---

## How local progress works

Everything is stored under a single versioned key:

```
theall-bible-coffee:mvp:v1
```

Stored: maximum reading percentage, last section ID, checkpoint passed, reflection
completed, chapter completed, theme, font size, and the three validation-feedback
answers.

Never stored: name, email, any account or device identifier, or the reflection text
itself. The reflection lives in component state for the current session only and is
discarded on submit — only `reflectionCompleted` is kept.

### The Coffee Cup

- Reading fills the cup from 0% to a hard ceiling of **90%**.
- The saved maximum never decreases — scrolling back up costs nothing.
- The final **10%** is granted only when the checkpoint is passed *and* the
  reflection is completed, which produces exactly 100%.
- A numeric percentage is always shown alongside the cup, and screen readers get a
  full Thai sentence. Progress is never communicated by colour alone.

### Failure handling

Restored data is parsed with Zod before use. Missing storage, blocked storage,
corrupted JSON, an invalid shape, or an older schema version all fall back to a clean
state instead of breaking the reading page. An unusable entry is removed so it cannot
fail twice.

### Swapping storage later

The UI only talks to the `ProgressStore` interface (`src/lib/progress/store.ts`).
`LocalProgressStore` is one implementation; a database-backed one can replace it
without touching a single component. `ProgressController` wraps a store and exposes
it to React through `useSyncExternalStore`.

---

## Resetting beta data

In the app: **การแสดงผล** (top right) → **รีเซ็ตข้อมูลทดสอบบนเครื่องนี้**, then
confirm. The reset removes only this app's key — other data on the same origin is
left alone.

---

## Deploying

The default target is Vercel.

**Important:** this app is a package inside a pnpm workspace, so the project's
**Root Directory must be set to `theall-bible-coffee`**.

### Vercel dashboard

1. Import the GitHub repository.
2. Set **Root Directory** to `theall-bible-coffee`.
3. Framework preset: Next.js. Build command, output directory and install command can
   stay on their defaults.
4. No environment variables are required — there are no external services.
5. Deploy. Every push to the branch produces a preview URL.

### Vercel CLI

```bash
npm i -g vercel
cd theall-bible-coffee
vercel            # preview deployment
vercel --prod     # production deployment
```

### Anywhere else

Any host that runs a Next.js 16 server works:

```bash
pnpm build
pnpm start        # defaults to port 3000
```

After deploying, open the preview URL on a real phone and walk the whole journey
once — homepage, overview, chapter, checkpoint, reflection, completion, feedback,
copy — before handing the link to a tester.

---

## Project layout

```
content/books/ephesians/th/chapter-01.json   the chapter, the only content file
scripts/validate-content.ts                  content gate
src/app/                                     routes, layout, theme bootstrap, tokens
src/components/coffee-cup.tsx                the single progress visualisation
src/components/reader/                       blocks, reader, checkpoint, reflection,
                                             completion, validation feedback
src/lib/content/                             Zod schema + server-side loader
src/lib/progress/                            pure rules, storage boundary, controller
e2e/                                         Playwright smoke test
docs/                                        MVP status and the user test script
```

## Tech

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
Motion for React · Zod 4 · Vitest · Playwright.

No Supabase, no ORM, no auth, no analytics SDK, no CMS.
