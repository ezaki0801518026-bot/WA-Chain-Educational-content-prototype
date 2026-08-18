# Implementation Plan — Washi Course e-Learning App (MVP)

Source requirements: `washi-course-prompt.md`

---

## 1. File / Component Breakdown

**Project root**
- `package.json` — Vite + React project manifest, scripts for dev/build/preview
- `vite.config.js` — Vite configuration (base path for static hosting)
- `index.html` — SPA entry point, mounts `<div id="root">`
- `README.md` — Setup instructions, how to add sections by editing lessons.json, how to enable audio

**`data/`**
- `data/lessons.json` — Single source of truth for all lesson content, quiz questions, image slots, SVG references, and audio fields; zero lesson text lives anywhere else

**`public/`**
- `public/favicon.svg` — Minimal washi-aesthetic SVG favicon

**`src/`**
- `src/main.jsx` — React entry; mounts `<App />`
- `src/App.jsx` — Top-level router (hash-based SPA routing: home / lesson / quiz / summary); imports lessons.json; reads/writes localStorage progress state
- `src/App.module.css` — Global layout variables (colour tokens, font stack, spacing scale)

**`src/pages/`**
- `src/pages/HomePage.jsx` — Curriculum overview: lists all 25 planned sections (4 active, rest "Coming soon"), shows per-section completion status pulled from localStorage
- `src/pages/HomePage.module.css` — Grid/card styles for curriculum list
- `src/pages/LessonPage.jsx` — Step-by-step lesson viewer; reads current section from lessons.json; manages local step index state; routes to QuizPage on finish
- `src/pages/LessonPage.module.css` — Lesson typography, step progress indicator, SVG figure wrapper styles
- `src/pages/QuizPage.jsx` — 5-question quiz for one section; shows one question at a time; reveals correct/incorrect + explanation after answer; routes to SummaryPage on completion; writes result to localStorage
- `src/pages/QuizPage.module.css` — Quiz option button states (unanswered / correct / incorrect), explanation reveal styles
- `src/pages/SummaryPage.jsx` — Section completion screen: bullet-point key takeaways, factual quiz score display, link to next section or home
- `src/pages/SummaryPage.module.css` — Summary card and navigation link styles

**`src/components/`**
- `src/components/StepView.jsx` — Renders a single lesson step: heading, paragraphs, optional SVG diagram, optional ImageSlot, optional AudioButton; driven entirely by data props
- `src/components/StepView.module.css` — Step content layout, paragraph spacing
- `src/components/ImageSlot.jsx` — Renders a bordered placeholder box with "Photo: coming soon — [description]" text when imageSlot is defined; accepts real src later
- `src/components/ImageSlot.module.css` — Dashed-border placeholder box, caption style
- `src/components/AudioButton.jsx` — Renders a plain play button only when audioSrc is non-null; hidden (returns null) when audioSrc is null
- `src/components/AudioButton.module.css` — Minimal button style, no decorative icons beyond a simple triangle/text
- `src/components/ProgressIndicator.jsx` — Displays "Step N / M" or "Section N of 4 completed" as plain text; no visual progress bar
- `src/components/ProgressIndicator.module.css` — Small, muted caption style
- `src/components/SectionCard.jsx` — A single section entry on the HomePage: title, short description, completion badge (text only), active vs. greyed-out "Coming soon" state
- `src/components/SectionCard.module.css` — Card border, typography, muted state styles

**`src/svg/`** (one file per diagram, exported as React components)
- `src/svg/StructureDiagram.jsx` — Section 1: honshi surrounded by sōtei layers (SVG)
- `src/svg/CelluloseDiagram.jsx` — Section 2: simplified cellulose chain + lignin bar chart comparison (SVG)
- `src/svg/HydrogenBondingDiagram.jsx` — Section 3: three-stage static step diagram of water molecules departing and fibers bonding (SVG)
- `src/svg/FiberLengthChart.jsx` — Section 4: horizontal bar chart kōzo / gampi / mitsumata / wood pulp (SVG)

**`src/utils/`**
- `src/utils/progress.js` — Read/write helpers for localStorage: `getProgress()`, `setSectionComplete(sectionId)`, `setQuizResult(sectionId, correct, total)`, `resetProgress()`

---

## 2. Data Schema

The exact JSON shape of `data/lessons.json` is an object with a `sections` array. Below is one fully worked example entry for Section 1.

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "The Philosophy of Conservation — Sōkō and Reversibility",
      "description": "Understand the conceptual foundations that distinguish Japanese mounting conservation from other traditions, and why reversibility is the discipline's central ethical commitment.",
      "active": true,
      "summaryPoints": [
        "Sōkō (装潢) encompasses both mounting a work for viewing and preparing the paper support — the two are inseparable.",
        "The honshi (本紙), or primary support, is the cultural asset; the sōtei (装丁) mounting is a replaceable protective system.",
        "All materials and adhesives must be removable with water so future conservators can treat the work with better technology.",
        "Every treatment decision is grounded in observed deterioration, scientific data, and professional judgment — not routine.",
        "Conservation priorities rank: (1) preservation of honshi, (2) structural stability, (3) visual harmony."
      ],
      "steps": [
        {
          "id": "s1-step-1",
          "heading": "What Is Sōkō?",
          "paragraphs": [
            "The term sōkō (装潢) combines two characters that reveal its dual nature: sō (装), meaning to mount or dress, and kō (潢), referring to the dyeing and preparation of paper. Together they describe a discipline that is simultaneously technical craft and curatorial philosophy.",
            "East Asian paintings and calligraphy are created on fragile primary supports — honshi (本紙) — made of washi paper or silk. Unlike Western panel paintings, these works have no rigid substrate of their own. From the moment of creation they depend on a surrounding structure, the sōtei (装丁) or mounting, to be handled, stored, and displayed safely.",
            "Understanding this dependency is the starting point for all conservation work on Japanese scrolls, albums, and screens. The mounting is not decoration; it is the engineering that allows the honshi to survive."
          ],
          "svgRef": "StructureDiagram",
          "imageSlot": {
            "label": "Comparative photograph: honshi and sōtei layers",
            "description": "Cross-section or exploded view photograph showing a hanging scroll's honshi, hada-uragami lining, and outer fabric layers before reassembly"
          },
          "audioSrc": null
        },
        {
          "id": "s1-step-2",
          "heading": "The Mounting as a Replaceable System",
          "paragraphs": [
            "A foundational principle of Japanese conservation is that the honshi is the cultural asset; the mounting is its protective and display apparatus. When a mounting deteriorates to the point that it threatens the honshi — through mechanical stress, acidic migration, or biological damage — the correct response is not to preserve the mounting at the expense of the work. The mounting is renewed; the honshi continues.",
            "This distinction matters practically. A conservator assessing a damaged hanging scroll must evaluate the honshi's condition independently of the mounting's condition. If the hada-uragami (肌裏紙, first lining paper) has become brittle and is pulling the honshi's fibers apart, the lining must be replaced even if the outer silk appears visually intact.",
            "The implication for material selection is direct: every component of a new mounting must itself be stable, reversible, and chemically neutral, because it will eventually need to be removed by someone else."
          ],
          "svgRef": null,
          "imageSlot": {
            "label": "Before and after treatment comparison",
            "description": "Photographs of the same hanging scroll honshi before treatment (creased, torn, lining detached) and after treatment (consolidated, re-lined, mounted)"
          },
          "audioSrc": null
        },
        {
          "id": "s1-step-3",
          "heading": "Reversibility and the 100-Year Cycle",
          "paragraphs": [
            "Traditional Japanese conservation operates on an approximately 100-year treatment cycle. This is not a bureaucratic interval; it reflects the realistic lifespan of the organic materials — wheat starch paste, washi linings, silk fabrics — used in each treatment. When those materials reach the end of their service life, the work is retreated.",
            "The defining feature of this system is that every intervention must be reversible. The primary adhesive, wheat starch paste (shinnori or konnyaku nori depending on preparation), is stable when dry but releases cleanly in water. The washi linings are selected to be strong enough to protect the honshi but weak enough, at their fiber bonds, to separate safely when re-wetted. No component should require a solvent, a blade, or significant mechanical force to remove.",
            "Reversibility is therefore not merely a technical preference. It is an ethical commitment to the conservators of the next century, preserving their ability to apply techniques and materials that do not yet exist."
          ],
          "svgRef": null,
          "imageSlot": {
            "label": "Wet lining removal demonstration",
            "description": "A dampened hada-uragami being lifted from a honshi surface during re-lining, showing clean separation without fiber damage"
          },
          "audioSrc": null
        },
        {
          "id": "s1-step-4",
          "heading": "Priorities in Practice",
          "paragraphs": [
            "When treatment options conflict, Japanese conservation follows a clear hierarchy. First priority is the physical preservation of the honshi: its fibers, its coloring layers, its inscriptions. Structural stability — the ability of the remounted work to be handled and stored without further deterioration — comes second. Visual harmony, meaning how well the new mounting matches the original or complements the work aesthetically, is addressed only after the first two are secured.",
            "This ordering has practical consequences. A conservator may choose a visually imperfect repair patch if the chemically correct paper requires it. The mounting fabric may be selected for its pH and weave rather than its color match. Documentation of every decision — materials used, condition observed, alternatives considered — is itself part of the treatment, ensuring the next conservator understands the reasoning."
          ],
          "svgRef": null,
          "imageSlot": null,
          "audioSrc": null
        }
      ],
      "quiz": [
        {
          "id": "s1-q1",
          "text": "A colleague argues that a beautifully preserved outer silk mounting justifies leaving a deteriorating hada-uragami in place to avoid disturbing the work. Which principle from Section 1 most directly challenges this argument?",
          "options": [
            { "id": "s1-q1-a", "text": "The sōtei is the cultural asset and must be protected at all costs." },
            { "id": "s1-q1-b", "text": "The honshi is the cultural asset; the mounting is a replaceable protective system." },
            { "id": "s1-q1-c", "text": "Visual harmony ranks above structural stability in the conservation priority hierarchy." },
            { "id": "s1-q1-d", "text": "Interventions should only be made when the mounting fabric is also damaged." }
          ],
          "correctOptionId": "s1-q1-b",
          "explanation": "The core principle of sōkō conservation is that the honshi is the irreplaceable cultural asset; the mounting exists to serve and protect it. When a mounting component — here the hada-uragami — threatens the honshi's integrity, it must be replaced regardless of the outer layers' appearance. Options A and D invert or misapply this hierarchy, and option C contradicts the explicit priority order (structural stability precedes visual harmony)."
        },
        {
          "id": "s1-q2",
          "text": "Why does Japanese conservation favor a roughly 100-year treatment cycle rather than using permanent adhesives that would never require retreatment?",
          "options": [
            { "id": "s1-q2-a", "text": "Permanent adhesives are more expensive and harder to source." },
            { "id": "s1-q2-b", "text": "Permanent adhesives are prohibited by international treaty." },
            { "id": "s1-q2-c", "text": "Reversible materials preserve the ability of future conservators to apply improved techniques." },
            { "id": "s1-q2-d", "text": "Organic materials naturally last exactly 100 years before failing." }
          ],
          "correctOptionId": "s1-q2-c",
          "explanation": "Reversibility is an ethical commitment to future practitioners. Permanent interventions foreclose options that do not yet exist. The 100-year interval is an approximate reflection of organic material lifespan, not a fixed biological fact (ruling out D), and is driven by philosophy rather than cost or regulation (ruling out A and B)."
        },
        {
          "id": "s1-q3",
          "text": "A hanging scroll arrives with a honshi in fragile condition and a mounting that is visually striking but chemically acidic. In what order should conservation goals be addressed?",
          "options": [
            { "id": "s1-q3-a", "text": "Visual harmony → structural stability → honshi preservation" },
            { "id": "s1-q3-b", "text": "Structural stability → honshi preservation → visual harmony" },
            { "id": "s1-q3-c", "text": "Honshi preservation → structural stability → visual harmony" },
            { "id": "s1-q3-d", "text": "Honshi preservation → visual harmony → structural stability" }
          ],
          "correctOptionId": "s1-q3-c",
          "explanation": "The explicit priority hierarchy from Section 1 is: (1) preservation of the honshi, (2) structural stability, (3) visual harmony. An acidic mounting migrating into a fragile honshi makes honshi preservation the immediate concern. Visual considerations come last and must never compromise the first two priorities."
        },
        {
          "id": "s1-q4",
          "text": "Which of the following best describes the role of wheat starch paste in the reversibility system?",
          "options": [
            { "id": "s1-q4-a", "text": "It creates a permanent bond stronger than the paper fibers to prevent future delamination." },
            { "id": "s1-q4-b", "text": "It is stable when dry but releases cleanly in water, allowing future re-treatment without mechanical force." },
            { "id": "s1-q4-c", "text": "It is used only as a consolidant for flaking pigment layers, not as a structural adhesive." },
            { "id": "s1-q4-d", "text": "It becomes more soluble over time, eventually dissolving on its own after 100 years." }
          ],
          "correctOptionId": "s1-q4-b",
          "explanation": "Wheat starch paste is the primary mounting adhesive precisely because it is reversible in water. It is strong enough to bond linings securely during use but releases without damaging fiber when re-wetted. Option A describes the opposite of the design goal; option C misidentifies its primary use; option D invents a self-dissolving property that does not exist."
        },
        {
          "id": "s1-q5",
          "text": "A conservator documents every material used in a treatment, the deterioration observed, and the alternatives considered. From the perspective of Section 1, why is this documentation itself part of the treatment?",
          "options": [
            { "id": "s1-q5-a", "text": "It satisfies legal requirements for cultural property handling in Japan." },
            { "id": "s1-q5-b", "text": "It allows the conservator to bill accurately for time and materials." },
            { "id": "s1-q5-c", "text": "It ensures future conservators understand the reasoning behind decisions, enabling informed re-treatment." },
            { "id": "s1-q5-d", "text": "It is required to obtain museum insurance for the work during treatment." }
          ],
          "correctOptionId": "s1-q5-c",
          "explanation": "Documentation is a direct expression of the reversibility ethic: just as materials must be removable, reasoning must be transparent. Future conservators cannot make informed decisions about re-treatment if they cannot understand what was done and why. Options A, B, and D describe administrative or financial motivations that are not part of the conservation philosophy outlined in Section 1."
        }
      ]
    }
  ]
}
```

---

## 3. Build Order (Milestones)

**Milestone 1 — Project scaffold**
- Initialize Vite + React project at `washi-course/`
- Install zero UI library dependencies; configure `vite.config.js` for static output
- Create `data/lessons.json` with Section 1 data only (steps + quiz complete, `audioSrc: null` on all entries)
- Create `src/utils/progress.js` with localStorage read/write helpers
- Verifiable: `npm run dev` starts without errors; `data/lessons.json` is valid JSON

**Milestone 2 — Design system and global styles**
- Implement CSS custom properties in `App.module.css`: `--bg: #f5f0e8`, `--text: #1a1a1a`, `--accent: #4a4a3a`, heading font stack `Georgia, "Noto Serif", serif`, body font `system-ui, sans-serif`
- Implement generous whitespace scale (padding/margin in `rem` units)
- Create stub `HomePage` that renders the washi colour palette and typography with placeholder text
- Verifiable: `localhost` shows the correct background colour, serif headings, and no extraneous dependencies

**Milestone 3 — Section 1 lesson flow end-to-end**

**STOP FOR REVIEW** — This milestone is the checkpoint specified in the requirements document. Human must approve the design tone before proceeding.

- Implement `StepView`, `ImageSlot`, `AudioButton` (hidden when `audioSrc: null`), `ProgressIndicator`
- Implement `LessonPage` with step-by-step navigation ("Step N / M"), wiring Section 1 data
- Implement `StructureDiagram.jsx` SVG (honshi surrounded by sōtei layers)
- Render all four ImageSlot placeholders from Section 1 data with "Photo: coming soon — [description]" text
- Verifiable: User can click through all Section 1 steps; SVG diagram appears; image placeholders appear; audio button is absent

**Milestone 4 — Quiz and summary for Section 1**
- Implement `QuizPage`: renders one question at a time, reveals correct/incorrect + explanation on answer, shows "Quiz: N/5 correct" at end, writes result to localStorage
- Implement `SummaryPage`: bullet-point key takeaways from `summaryPoints` field, factual score display, link to next section
- Verifiable: Complete a full Section 1 loop (lesson → quiz → summary); score persists in localStorage on page reload

**Milestone 5 — Sections 2–4 content and SVGs**

Revised after the Section 1 design review (2026-07-08) to apply three standing design policies to every section from here forward, not just Section 1:

1. **3+ visual elements per section.** Each section needs at least three visual elements combining SVG diagrams and `imageSlot` photo placeholders (Section 1 landed at 3 SVGs + 2 photos = 5). A single per-section SVG is no longer sufficient — split multi-part figures (e.g. a chain diagram + a bar chart) into distinct diagram components/steps rather than cramming one busy SVG.
2. **Single-screen, single-concept steps.** Split each section into ~7–9 steps of 1–2 paragraphs each, designed to fit one viewport without vertical scroll (verified headlessly at 1280×720 through 1920×1080 — see Milestone 3/4 pattern: `box-sizing: border-box` globally, `height`/`max-height: 100vh` on the page container, tightened spacing before ever shrinking diagrams, fonts, or splitting a step further). Diagrams that have discrete, explainable parts (like `StructureDiagram`'s layers) should be interactive: click a part to highlight it and reveal its description, sourced from `lessons.json` (e.g. a `svgInteractions` field), never hardcoded in the component.
3. **Light, functional micro-animation only.** Reuse the established patterns — a brief checkmark fade on forward step/quiz progress, a smooth ~200ms slide transition between steps, a gentle highlight transition on diagram interaction. No praise text, scores-as-spectacle, characters, sound, streaks, or confetti.

Because policy 2 favors short, single-idea paragraphs over long-form reading, actual per-section prose may land under the original 1,200–1,800 word target from the requirements doc — that tradeoff was confirmed acceptable during the Section 1 review.

- Add Sections 2, 3, 4 to `data/lessons.json` (steps + quiz + summaryPoints), each meeting policies 1–3 above
- Implement `CelluloseDiagram.jsx` (+ a lignin bar-chart view/component) and an acidity/pH comparison diagram for Section 2; `HydrogenBondingDiagram.jsx` (+ a fiber-length-vs-bond-points diagram) for Section 3; `FiberLengthChart.jsx` (+ a fiber-shape identification diagram) for Section 4 — additional small diagrams beyond the original one-per-section plan are expected in order to satisfy policy 1
- All `imageSlot` placeholders render correctly, with specific descriptions (and the `isPlaceholder`/`src` mechanism from Section 1 available for stand-in images)
- `SummaryPage` "Continue to next section" chain works section-to-section (1 → 2 → 3 → 4)
- Verifiable: Each of the four sections completes the full lesson → quiz → summary flow without errors, and headless viewport checks (1280×720–1920×1080) show zero page-level vertical scroll on every lesson step and per-question quiz screen

**Milestone 6 — Home page and Coming Soon sections**
- Implement `HomePage` with full 25-section curriculum list (4 active, 21 greyed "Coming soon")
- `SectionCard` shows completion state from localStorage
- Implement `App.jsx` hash-router to navigate between home / lesson / quiz / summary
- Verifiable: Home page lists all 25 sections; completed sections show factual completion text; coming-soon sections are visually distinct and not clickable (or clickable but display a "not yet available" message — see Open Questions)

**Milestone 7 — Polish, responsiveness, and definition of done**
- Responsive layout for PC and tablet (CSS breakpoints — see Open Questions for exact px values)
- Confirm audio: add one dummy `audioSrc` value to a single step, verify play button appears, then set back to `null`
- `README.md`: document how to add a section (edit `lessons.json` only), how to enable audio, how to build and deploy
- `npm run build` produces a fully static output deployable to Vercel / GitHub Pages
- Verifiable: All four definition-of-done criteria from the requirements are met

---

## 4. Non-Negotiable Constraints

1. **No gamification.** No points, scores with celebratory presentation, sound effects, characters, or flashy animations of any kind. The tone is that of a Coursera or university lecture resource — calm and academic throughout.

2. **Progress display is factual only.** Permitted: "Section 3 of 4 completed", "Quiz: 4/5 correct". Prohibited: badges, stars, praise messages ("Great job!", "You're on a roll!"), confetti, or any congratulatory UI elements.

3. **Washi design aesthetic — exact CSS values required.**
   - Background: `#f5f0e8`
   - Text: `#1a1a1a`
   - Accent: `#4a4a3a`
   - Heading font stack: `"Lora", Georgia, "Noto Serif", serif` (revised from the original `Georgia, "Noto Serif", serif` after Milestone 2 design review — Georgia read as too classical; Lora, loaded from Google Fonts, keeps a serif academic tone with a more contemporary letterform)
   - Body font stack: `system-ui, sans-serif`
   - Generous whitespace throughout; no bright colours, no gradients

4. **No AI-generated photorealistic images and no approximate illustrative photographs of any kind.** The target audience are professional conservators who work with original objects daily. An inaccurate image of a microscope view, a deteriorated paper, or a repair process destroys the credibility of the entire course.

5. **ImageSlots must render as explicit placeholders.** When an `imageSlot` object is present in the data, the UI renders a bordered placeholder box containing the text "Photo: coming soon — [description]" where `[description]` is the `imageSlot.description` field value. The data structure must allow a real image `src` to be inserted later without changing the component.

6. **AudioButton behavior.** When `audioSrc` is `null` in the lesson data, no audio button is rendered — the element must not appear at all (return `null` from the component, not a hidden element). When `audioSrc` is a non-null string (an mp3 path), a plain play button appears at the lesson or paragraph level.

7. **Content/UI separation is absolute.** All lesson text, quiz question text, option text, explanation text, diagram references (`svgRef`), image slot definitions, and audio fields live in `data/lessons.json`. Zero hardcoded lesson content exists in any component or page file. Adding or editing a section must require only editing `data/lessons.json`.

8. **Lesson text is original English prose.** Each of the four sections must be 1,200–1,800 words of newly written English. The structure is: opening with a practical question from professional practice → theoretical explanation (Why) → application to conservation work → summary. Japanese technical terms are introduced in romanized form with a functional English definition on first use (example pattern: *hada-uragami* (first lining paper)).

9. **Technical stack constraints.**
   - Framework: React + Vite (or equivalent modern static SPA stack)
   - Styling: plain CSS or CSS Modules only — no Tailwind, no styled-components, no UI component library
   - State persistence: localStorage only — no backend, no user accounts
   - Responsive: must work correctly on PC screen widths and tablet screen widths
   - Dependencies: minimized; only what is genuinely necessary

10. **Copyright compliance.** Scientific facts, numerical values (fiber lengths, pH values), and technical terminology may be used freely as they are not copyrightable. Long passages from Japanese source texts must not be translated verbatim or reproduced. All prose is newly composed.

11. **Build target.** `npm run build` must produce a fully static output deployable without a server to Vercel or GitHub Pages.

12. **README requirement.** The README must explicitly document: (a) how to add a new section by editing `lessons.json` only, (b) how to activate audio for a lesson by setting `audioSrc` to an mp3 path, (c) how to build and deploy.

---

## 5. Open Questions — RESOLVED

1. **Quiz pass threshold:** No pass/fail gate. Display correct count factually ("Quiz: 4/5 correct") and always allow progression regardless of score.

2. **Coming Soon clickability:** Non-interactive. Greyed-out, title only, no cursor change, no click handler.

3. **Mobile breakpoint:** Single breakpoint at 768px.

4. **SVG colour palette:** Background `#f5f0e8`, lines/text dark grey `#2b2b2b`, one accent colour muted vermilion `#b5533c`. No other colours.

5. **Quiz page layout:** Show one question at a time with Next button. After all questions, show a review list of all questions with correct/incorrect indicators and explanations.

6. **Section 2–4 summaryPoints:** Builder derives from lesson outline (placeholder content acceptable for MVP).

7. **Accessibility:** Target WCAG 2.1 AA. Fully keyboard-navigable quiz; explicit focus management between steps.

8. **25-section English titles:** *(To be provided by human before Milestone 6 — Coming Soon list uses Japanese source titles translated by builder in the interim.)*
