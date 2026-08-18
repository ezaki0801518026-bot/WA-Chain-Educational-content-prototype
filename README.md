# Washi Conservation Course

A structured e-learning course on the scientific and philosophical foundations
of Japanese mounting conservation (sōkō), for professional paper and painting
conservators. Built as a static React + Vite single-page app — no backend, no
accounts. Progress and quiz results are stored in the browser's `localStorage`.

## Development

```bash
npm install
npm run dev
```

This starts a local dev server (Vite prints the URL, typically
`http://localhost:5173`).

## Content model

**All lesson content lives in `data/lessons.json` and nowhere else.** No
component or page file contains hardcoded lesson text, quiz questions, or
answer explanations. Adding, editing, or reordering a section only ever
requires editing this one file.

`data/lessons.json` is a single object with a `sections` array. Each section
looks like this:

```json
{
  "id": "section-5",
  "title": "Section Title",
  "description": "One or two sentences shown on the home page card.",
  "active": true,
  "video": null,
  "summaryPoints": ["Key takeaway 1", "Key takeaway 2", "..."],
  "steps": [
    {
      "id": "s5-step-1",
      "heading": "Step Heading",
      "paragraphs": ["Paragraph one.", "Paragraph two."],
      "svgRef": null,
      "svgInteractions": null,
      "imageSlot": null,
      "audioSrc": null
    }
  ],
  "quiz": [
    {
      "id": "s5-q1",
      "text": "Question text.",
      "options": [
        { "id": "s5-q1-a", "text": "Option A" },
        { "id": "s5-q1-b", "text": "Option B" }
      ],
      "correctOptionId": "s5-q1-b",
      "explanation": "Why B is correct and why the others are wrong."
    }
  ]
}
```

### Adding a new active section

1. Copy the shape above into the `sections` array of `data/lessons.json`
   (anywhere — order in the array determines display order and numbering on
   the home page).
2. Use a unique `id` (convention: `section-N`) and prefix all nested `steps`
   and `quiz` ids with the same short form (e.g. `s5-step-1`, `s5-q1`) to keep
   ids collision-free across sections.
3. Set `"active": true`. The home page will automatically render it as a
   clickable section card with a "Begin section" button — no code changes
   needed.
4. Aim for 7–9 steps of 1–2 short paragraphs each (the lesson viewer is
   designed to show one step per screen without scrolling), and a 5-question
   quiz.

### Adding a "Coming soon" (inactive) placeholder section

Add an entry with just `id`, `title`, and `"active": false` — no `steps` or
`quiz` needed:

```json
{ "id": "section-26", "title": "Future Section Title", "active": false }
```

It will render as a greyed, title-only, non-clickable card.

### Step fields

| Field | Type | Purpose |
|---|---|---|
| `heading` | string | Step heading (rendered as an `<h2>`) |
| `paragraphs` | string[] | Body paragraphs for the step |
| `svgRef` | string \| null | Name of a diagram component registered in `src/svg/index.js` (e.g. `"StructureDiagram"`). Omit or set `null` for no diagram. |
| `svgInteractions` | array \| null | Optional data passed to interactive diagrams (e.g. `StructureDiagram`'s clickable-layer labels/descriptions). Only used by diagrams that support it. |
| `imageSlot` | object \| null | See below. |
| `audioSrc` | string \| null | See "Audio" below. |

### Image placeholders (`imageSlot`)

```json
"imageSlot": {
  "label": "Short caption",
  "description": "One sentence describing the real photo that belongs here.",
  "src": null,
  "isPlaceholder": false
}
```

- When `src` is `null`, the step renders a dashed-border placeholder box with
  the text **"Photo: coming soon — `{description}`"**. No real or
  AI-generated photorealistic images should ever be used as a substitute —
  professional conservators can tell, and an inaccurate image undermines the
  course's credibility.
- To drop in a real photograph later, add the file under `public/images/...`
  and set `"src": "images/your-file.jpg"`. **Compress and resize photos
  before adding them** — camera-original files can be 5–10MB each, which is
  unacceptable for a static site meant to load quickly. Aim for roughly
  1200–1600px on the long edge and JPEG quality ~75–80 (a few hundred KB per
  photo, not several MB).
- To drop in a temporary stand-in image (not the final photograph), set
  `"src"` as above **and** `"isPlaceholder": true`. A small "PLACEHOLDER"
  badge is overlaid on the image's corner so it stays visually distinguishable
  from a final asset. Set `"isPlaceholder": false` once the real photo is in
  place.
- Set `"imageSlot": null` entirely for steps that don't need a photo.

### Section intro video

A section-level (not per-step) `video` field controls an optional video
introduction shown before the lesson:

```json
"video": {
  "src": "video/section-5-introduction.mp4",
  "label": "Video introduction: Section title"
}
```

- When `video` is `null` or omitted, the section's "Begin section" button on
  the home page goes straight to the lesson, exactly as before — the video
  step is skipped entirely.
- When `video` is set, "Begin section" instead opens `#/video/:sectionId`, a
  simple page with a native `<video controls>` player and a "Continue to
  lecture" button. The flow becomes **Video → Lecture (lesson) → Quiz**.
- Add the video file under `public/video/...`. Keep it reasonably compressed
  for a static site — there is no video hosting/CDN here, the file ships as
  part of the static build.

### Audio

Every step has an `audioSrc` field. When it is `null`, no audio button is
rendered at all (not hidden — genuinely absent from the page). To enable
narration for a step:

1. Add the mp3 file under `public/audio/...` (create the folder as needed).
2. Set the step's `audioSrc` to the file's path, e.g.
   `"audioSrc": "audio/section-1/step-1.mp3"`.
3. A plain "▶ Play audio" button appears on that step automatically; no
   component changes are needed. It toggles to "⏸ Pause audio" during
   playback.

## Future-plans menu and section-request survey

Two lightweight features live outside the lesson content model:

- **"Also planned" menu** (`src/components/FeaturesMenu.jsx`) — a hamburger
  button in the header that opens a modal listing service ideas under
  consideration (chat consultation, a washi-kit + course bundle, a
  subscription plan, a terminology dictionary, a conservator community,
  post-course feedback). Each entry in the `FEATURES` array has a `route`
  field: `null` renders plain "Coming soon" text (chat, feedback — truly
  not built); a path (e.g. `/pricing`) renders a "Preview available →"
  link to a real page instead (kit/subscription → Pricing, dictionary →
  Glossary, community → Community). Edit `FEATURES` and the matching
  `feature*Title`/`feature*Desc` strings in `src/i18n/strings.js` to add,
  remove, or promote an entry from idea to preview.
- **Section-request survey popup** (`src/components/SurveyPopup.jsx`) —
  a small dismissible card in the bottom-right corner, shown on the home
  page only (deliberately not on Lesson/Quiz/Video pages, which already
  have a fixed action button in that same corner). Appears after a short
  delay; once dismissed or submitted it never reappears in that browser
  (tracked via `localStorage`). The section dropdown is generated
  automatically from every inactive (`"active": false"`) entry in
  `data/lessons.json`, grouped by `track` — no manual list to maintain.

  Submission goes through [formsubmit.co](https://formsubmit.co)'s AJAX
  endpoint via `fetch()`, so the page never navigates away. **The first
  submission to a new destination email requires a one-time confirmation
  click from that inbox before formsubmit.co will deliver anything** — if
  responses aren't arriving, check that inbox (including spam) for a
  confirmation email from formsubmit.co and confirm it. The request has a
  10-second client-side timeout so a blocked or slow network shows a
  retryable error instead of leaving the popup stuck on "Sending…"
  forever. The destination address is set in `FORM_ENDPOINT` at the top of
  `SurveyPopup.jsx`.

## Flagship-preview pages (Pricing, Glossary, Community)

Three of the "Also planned" ideas have a real (if early-stage) page,
linked directly from the header nav bar rather than buried in the
hamburger menu — the goal is a site that feels populated and real, not a
single course page with a "roadmap" list bolted on.

- **Pricing** (`#/pricing`, `src/pages/PricingPage.jsx`) — three tiers as
  cards. The Free tier is real (it describes what's actually available
  today, no signup). The Subscription and Washi-kit-bundle tiers are not
  built — their price is explicitly labeled "(indicative)" and their call
  to action is a waitlist signup, not a checkout, so nothing is ever
  charged for a feature that doesn't exist.
- **Glossary** (`#/glossary`, `src/pages/GlossaryPage.jsx`,
  `data/glossary.json`) — a genuinely real, working reference: concise
  original definitions (not copied from lesson prose) for terms already
  introduced in the active lessons, with client-side search and a link
  from each entry back to the section that covers it. Add a term by
  appending to `data/glossary.json` (`id`, `term`, `native`, `definition`,
  `relatedSectionId`) — no component changes needed.
- **Community** (`#/community`, `src/pages/CommunityPage.jsx`) — a short,
  honest pitch for the conservator-community idea plus a waitlist signup.
  Explicitly labeled "not yet built."

**`src/components/WaitlistForm.jsx`** is the shared email-capture form
behind the Pricing and Community waitlist CTAs — same formsubmit.co AJAX
pattern and 10-second timeout as `SurveyPopup.jsx`. Pass a `context`
string (used as the email subject) and it's fully self-contained.

## Design constraints (do not change without discussion)

- Colour tokens, font stacks, and spacing scale live in `src/App.module.css`
  as CSS custom properties (`--bg`, `--text`, `--accent`, `--font-heading`,
  `--font-body`, `--space-*`).
- No gamification: no points, badges, praise messages, sound effects,
  streaks, or confetti. Progress is always shown as plain factual text
  ("Section 3 of 4 completed", "Quiz: 4/5 correct"). Small functional
  micro-animations (a checkmark fade, a smooth step transition) are fine;
  celebratory ones are not.
- Responsive breakpoint at 768px (tablet and narrower) is implemented once,
  globally, via the `--space-lg`/`--space-xl` custom properties in
  `src/App.module.css`, rather than per-page media queries.

## Build and deploy

```bash
npm run build
```

This produces a fully static site in `dist/`. `vite.config.js` sets
`base: './'`, so the build uses relative asset paths and works when deployed
to a subpath (e.g. GitHub Pages project sites) as well as a domain root.

- **Vercel**: point the project at this repo; build command `npm run build`,
  output directory `dist`. No server-side configuration is needed.
- **GitHub Pages**: run `npm run build` and publish the contents of `dist/`
  to the `gh-pages` branch (or configure the Pages source to serve from
  `dist/` via your CI of choice).
- **Local preview of the production build**: `npm run preview`.

There is no backend and no environment configuration required — the app is
entirely static, and all state (progress, quiz scores) lives in the visitor's
browser `localStorage`.

## Regression check

```bash
npm run build
npm run verify
```

`scripts/verify.mjs` launches the production build (via `vite preview`) in a
real headless Chrome and, for every active section in `data/lessons.json`,
walks the full lesson → quiz → summary flow at several common desktop/laptop
viewport sizes. It fails (non-zero exit code) if any section produces a
page-level vertical scrollbar (lesson and quiz screens are designed to fit
one viewport per step) or if the browser logs a console error. Run it after
any change to lesson content, layout CSS, or step count before considering
the change done.

Requires a system Chrome, Chromium, or Edge install. If it isn't found at a
common install path, set `CHROME_PATH` to your browser's executable:

```bash
CHROME_PATH="/path/to/chrome" npm run verify
```
