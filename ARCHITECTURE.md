# Architecture & maintenance

Everything you need to run, change and debug this site without re-deriving how
it works. Read the first two sections once; use the rest as reference.

**Contents**

1. [The one-minute model](#1-the-one-minute-model)
2. [Everyday commands](#2-everyday-commands)
3. [Where content lives](#3-where-content-lives)
4. [The publish pipeline](#4-the-publish-pipeline)
5. [Deployment & the base path](#5-deployment--the-base-path)
6. [The admin panel](#6-the-admin-panel)
7. [Component reference](#7-component-reference)
8. [The `src/lib` helpers](#8-the-srclib-helpers)
9. [Git commands you will actually need](#9-git-commands-you-will-actually-need)
10. [Traps — read before debugging](#10-traps--read-before-debugging)
11. [Troubleshooting by symptom](#11-troubleshooting-by-symptom)

---

## 1. The one-minute model

```
ResumeApp/data/master.json          your CV, the single source of truth
        │
        │  npm run sync
        ▼
src/data/resume.json                generated — never edit by hand
        +
src/data/portfolio.config.json      your choices — written by the admin panel
        │
        │  npm run build   (Vite bundles both JSON files into the app)
        ▼
dist/                               static files
        │
        │  git push  →  GitHub Actions
        ▼
https://mohammed-amine-talhi.github.io
```

Three ideas explain almost every decision in this repo:

**The CV is the source of truth.** Projects, experience, education, visits and
languages come from ResumeApp. You edit them there and re-sync, so the site and
your PDF can never disagree.

**The config holds everything the CV can't.** Photos, documents, ordering,
visibility, crops, animation settings. The admin panel is just an editor for
that one JSON file.

**The admin is a local tool, not part of the site.** It runs only under
`npm run dev`. The deployed site is a plain static build with no admin code and
no way to write anything.

---

## 2. Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server + admin panel. Your working mode. |
| `npm run publish` | **The one command.** Sync → check → build → commit → push. |
| `npm run sync` | Pull fresh CV data from ResumeApp only. |
| `npm run build` | Production build into `dist/`. Fails on type errors. |
| `npm run preview` | Serve the built `dist/` locally, to check before shipping. |
| `npm run check-assets` | List config entries pointing at deleted files. |
| `npm run fix-assets` | Drop those dead references from the config. |

The normal loop:

```bash
npm run dev
```

Edit at `http://localhost:5173/#/admin`, press `Ctrl+S` to save, then:

```bash
npm run publish
```

---

## 3. Where content lives

### `src/data/resume.json` — generated

Written by `npm run sync` from `../ResumeApp/data/master.json`. **Editing it by
hand is pointless** — the next sync overwrites you. Change ResumeApp instead.

It deliberately drops `letterTemplate` and `interviewScript`: those are private
job-hunting assets and have no business in a public repo.

`syncedAt` only changes when the *content* changes. Stamping it on every run
made `npm run publish` produce a commit even when nothing had changed.

### `src/data/portfolio.config.json` — yours

| Key | Holds |
| --- | --- |
| `profile` | Photo + its crop, headline, intro paragraphs, GitHub URL |
| `contact` | Name, both emails, both phones, location, LinkedIn/GitHub |
| `cv` | `{ en, fr }` — one PDF per language, or `null` |
| `visits` | EMINES post link, trip photos, per-visit photos/links |
| `animation` | Preset, speed, hero-name effect, per-effect switches, ether brightness |
| `visibility` | `projects` / `experiences` → `{ id: boolean }` |
| `order.projects` | Project ids in display order |
| `projectMeta` | Per project: cover + crop, stack chips, documents |
| `customProjects` | Projects that exist only here, never in the CV |
| `leadership` | Clubs/sport entries: story, photos, crop, documents, accent |
| `skills` | The icon toolbox: name, icon key, family, linked projects, attachments |
| `languageProof` | Per language: badge text, certificate scans, PDFs |

**This file must be committed.** It *is* the content of your site.

### `public/` — uploaded files

| Folder | Holds |
| --- | --- |
| `public/` (root) | Profile photo |
| `public/covers/` | Project cover images |
| `public/docs/` | Reports, decks, posters, certificates |
| `public/cv/` | The two CV PDFs |
| `public/leadership/` | Club and basketball photos |
| `public/visits/` | Industrial-visit photos |

Accepted: `.jpg .jpeg .png .webp .gif .avif` and `.pdf .pptx .ppt .docx .doc .xlsx .zip`.
60 MB per file.

Uploads get a timestamp suffix (`IMG_3308-JPG-mt2tti2r.jpg`) so two files with
the same name never collide. That's why CV downloads are renamed on the way out
(see `downloadName` in `src/lib/asset.ts`).

---

## 4. The publish pipeline

`scripts/publish.mjs` runs five steps. Any failure stops it **before** anything
is committed or pushed.

```
[1/5] Syncing CV data      node scripts/sync-resume.mjs
[2/5] Checking files       node scripts/check-assets.mjs
[3/5] Building             npm run build          (tsc -b && vite build)
[4/5] Committing           git add -A
                           git commit -q -m "Update portfolio — <timestamp>"
[5/5] Pushing              git push -q origin main
```

It reads state with `git status --porcelain`, and **exits without committing if
that comes back empty** — so running it twice in a row does nothing the second
time.

### Why each guard exists

**Step 2 exists because deleting a file doesn't unlink it from the config.** You
delete `IMG_3308.jpg` from `public/leadership/`, but `portfolio.config.json`
still lists it, so the live site requests a file that isn't there and shows a
broken image. The check walks every path in the config — profile, CVs, leadership
photos and docs, project covers and docs, visit photos, language certificates,
skill attachments — and refuses to publish if any are missing, naming each one.

**Step 3 exists so a type error surfaces on your machine, not in CI.** `npm run
build` runs `tsc -b` first; a red build here costs seconds, a red build in
Actions costs a round trip.

### If it stops

Nothing was pushed. Fix what it printed and run it again. To publish despite a
missing file — which puts a broken image live — you'd have to run the git
commands from section 9 by hand. Don't.

---

## 5. Deployment & the base path

`.github/workflows/deploy.yml` runs on every push to `main`.

The one subtle part is the **base path**. A site served from a subfolder needs
every URL prefixed, or nothing loads:

| Repository name | URL | Base |
| --- | --- | --- |
| `mohammed-amine-talhi.github.io` | `https://mohammed-amine-talhi.github.io/` | `/` |
| anything else, e.g. `Portfolio` | `https://mohammed-amine-talhi.github.io/Portfolio/` | `/Portfolio/` |
| custom domain (a `public/CNAME` file) | `https://yourdomain.com/` | `/` |

The workflow works this out from the repo name and exports `BASE_PATH`, which
`vite.config.ts` reads. **The comparison is done in lower case on purpose** —
your owner name is `Mohammed-Amine-TALHI` and the repo is
`mohammed-amine-talhi.github.io`; an exact match would fail, the site would be
built as a project page, and every asset would 404.

Vite rewrites paths it can see (imports, `index.html`), but **not strings inside
JSON**. That's what `src/lib/asset.ts` is for — every config-sourced `src` and
`href` goes through `asset()`, which prefixes `import.meta.env.BASE_URL`. If you
add a new place that renders a config path, wrap it in `asset()` or it will break
the moment the site isn't at a domain root.

### One-time Pages setup (already done)

Repo → **Settings → Pages → Source: GitHub Actions**. If it's ever on "Deploy
from a branch", GitHub serves your repo root — you'll see the README instead of
the site.

---

## 6. The admin panel

`http://localhost:5173/#/admin`, only while `npm run dev` is running. `Ctrl+S`
saves.

### Why it can't reach the internet

Two independent locks:

1. **The UI** is behind `import.meta.env.DEV` in `src/App.tsx`. Vite resolves
   that to `false` at build time, so the whole admin chunk is tree-shaken out.
2. **The write API** is a Vite plugin in `vite.config.ts` marked
   `apply: 'serve'` — it exists only in the dev server. GitHub Pages serves
   static files and has nothing to write with.

Verify any time: `npm run build && grep -r "__admin" dist/` should find nothing.

### The API (dev only)

| Route | Purpose |
| --- | --- |
| `GET /__admin/config` | Read config + its mtime |
| `POST /__admin/config` | Write config, guarded by mtime |
| `POST /__admin/upload` | Save a base64 file into `public/<folder>/` |
| `GET /__admin/images` | List uploaded files |
| `POST /__admin/delete-image` | Delete one uploaded file |

Uploads are guarded: folder must be on the allow-list, extension must be
allowed, and the resolved path must stay inside `public/` (no `../` escapes).

### Concurrent edits

The admin loads the config from disk and remembers its timestamp. If the file
changed underneath you — another tab, a script — saving returns `409` and you
get a banner offering **Load disk version** or **Keep mine**. It will not
silently overwrite. This exists because it happened.

### The tabs

| Tab | Controls |
| --- | --- |
| **Projects** | Show/hide, reorder, cover + crop, stack chips, documents; custom projects |
| **Skills** | Toolbox (name, icon from a 104-icon searchable picker, family), project links, attachments; language certificates |
| **Leadership** | Story, photos + crop, fill/fit, documents, accent colour |
| **Visits** | EMINES post link, trip photos, per-visit photos and links |
| **Profile** | Photo + crop, headline, intro, experience visibility |
| **Contact & CV** | All contact fields, one CV per language |
| **Animations** | Presets, speed, ether brightness, hero-name effect, per-effect switches |

---

## 7. Component reference

### Page shell

| File | Role |
| --- | --- |
| `src/main.tsx` | Entry. Adds the `low-power` class on modest devices. |
| `src/App.tsx` | Section order, and the dev-only `#/admin` route. |
| `Nav.tsx` | Fixed navbar, scroll progress bar, scroll-spy, FR/EN switch. |
| `Background.tsx` | Fixed ambient layer: CSS blooms, LiquidEther, grid, vignette. |
| `Portal.tsx` | Renders overlays into `<body>`. **Load-bearing — see traps.** |
| `SectionHeading.tsx` | Shared eyebrow + animated title + rule. |
| `Lightbox.tsx` | Full-screen image viewer. Arrow keys, Escape, counter. |

### Sections, in document order

| File | Section |
| --- | --- |
| `Hero.tsx` | Name, headline, CTAs, CV button, stat row |
| `HeroName.tsx` | The name — 5 effects, always one line |
| `CountriesStat.tsx` | The three flags; click jumps to the evidence |
| `About.tsx` | Wraps profile + experience + education + visits |
| `about/ProfileCard.tsx` | Portrait, intro, soft skills, CV |
| `about/ExperienceTimeline.tsx` | Rail with a looping pulse, one card per role |
| `about/EducationPanel.tsx` | Degrees + course chips |
| `about/VisitsPanel.tsx` | Visits as single-line rows, photos, EMINES link |
| `Projects.tsx` | Filterable grid, 6 then "show all", documents |
| `SkillsSection.tsx` | Wraps skills + languages |
| `about/SkillsPanel.tsx` | Icon grid; click swaps the right panel |
| `about/FlowConsole.tsx` | The animated supply-chain readout |
| `about/SkillProjects.tsx` | Replaces the console when a skill is picked |
| `about/LanguagesPanel.tsx` | Language meters + certificates |
| `Leadership.tsx` | Cards that open a scrollable journal |
| `Contact.tsx` | Contact channels, CV panel, footer |

### `components/reactbits/`

React Bits is a **copy-in** library like shadcn/ui — the source lives here and is
yours to edit. It is not an npm dependency. (The `reactbits` package on npm is
unrelated; the third-party mirror lists three.js, GSAP, Chakra and matter-js as
peers, which is far too much weight for a portfolio.)

`StrokeText` · `SplitText` · `BlurText` · `ShinyText` · `GradientText` ·
`CountUp` · `AnimatedContent` · `SpotlightCard` · `Magnet` · `ClickSpark` ·
`LiquidEther`

`LiquidEther` is the WebGL background: fractal noise through two rounds of
domain warping, tinted amber, with a bulge that follows the cursor. Written
straight against WebGL — no three.js — so it costs about 2 kB of shader source
instead of ~600 kB of engine.

---

## 8. The `src/lib` helpers

| File | Responsibility |
| --- | --- |
| `types.ts` | Every shape in `portfolio.config.json`. Start here. |
| `data.ts` | Merges resume + config. `visibleProjects()`, `languageEntries()`, … |
| `i18n.tsx` | FR/EN context. `t(loc)` for CV data, `ui(key)` for chrome text. |
| `anim.ts` | Animation settings, presets, **and the device performance tier**. |
| `asset.ts` | `asset()` for base paths, `downloadName()` for clean downloads. |
| `crop.ts` | Non-destructive framing: focal point + zoom → CSS. |
| `skills.ts` | Config skills → icon components. |
| `iconRegistry.ts` | The 104 icons behind the picker. |
| `skillLinks.ts` | Which projects used a skill. |
| `preload.ts` | Warms images on idle so galleries open instantly. |

### Two worth understanding properly

**`anim.ts` — the performance tier.** `perfTier` is `'low'` on touch devices,
narrow screens, ≤4 CPU cores or ≤4 GB RAM. On low:

- the shader compiles 3 noise octaves instead of 5, renders at DPR 1 instead of
  1.5, and caps at 30fps — roughly 7× less work per second
- `backdrop-filter` is switched off in CSS via the `low-power` class
- perpetual loops (`orbitDots`, `timelinePulse`) stop; use `loopOn()` rather
  than `on()` for anything that animates forever

**`crop.ts` — cropping is non-destructive.** A crop stores
`{ x, y, zoom }` and is applied with `object-position` + `scale`. Your uploaded
file is **never modified**, so you can re-frame the same photo any number of
times, and the full-resolution original stays available for the lightbox.

---

## 9. Git commands you will actually need

`npm run publish` covers the normal case. These are for when it doesn't.

**Where am I?**

```bash
git status
```

**What changed, in detail?**

```bash
git diff
```

**Recent history:**

```bash
git log --oneline -10
```

**Commit and push by hand** (what `publish` does in steps 4–5):

```bash
git add -A && git commit -m "Your message" && git push origin main
```

**Undo edits to one file you haven't committed:**

```bash
git restore src/data/portfolio.config.json
```

**Undo the last commit but keep the changes:**

```bash
git reset --soft HEAD~1
```

**See what a past commit changed:**

```bash
git show <hash>
```

**Recover a file as it was in an earlier commit:**

```bash
git checkout <hash> -- path/to/file
```

**Check the deploy:**

```bash
gh run list --repo Mohammed-Amine-TALHI/Mohammed-amine-talhi.github.io --limit 5
```

**Read the logs of a failed deploy:**

```bash
gh run view <run-id> --repo Mohammed-Amine-TALHI/Mohammed-amine-talhi.github.io --log-failed
```

### Handle with care

`git push --force` overwrites the remote with your local history. It was used
once here, deliberately, to replace GitHub's placeholder README. Outside that
kind of case it destroys work.

`git reset --hard` throws away uncommitted changes with no undo. `git restore`
on a single file is almost always what you want instead.

---

## 10. Traps — read before debugging

These all cost real time to find. Each one is commented at its site in the code.

**Overlays must be portalled.** `<main>` has `relative z-10`, which creates a
stacking context. Anything inside it — however high its own z-index — paints
below the navbar's `z-40`. The lightbox's close button was unclickable because
of this. Any new full-screen overlay must be wrapped in `<Portal>`.

**Don't use `absolute` + `translate-x-*` together.** Tailwind v4 emits the
`translate` CSS property, which stacked on top of the resolved static position
and moved the toggle knob a full pill-width. Use flex or an inline style.

**Don't use framer's `layout` prop in the admin.** The admin re-clones its config
on every keystroke, so the layout projection never settles and framer pins the
element with a stale transform. This is the second bug the toggle had.

**Config paths need `asset()`.** Vite can't rewrite strings inside JSON. Any new
`src=` or `href=` reading from the config must go through `asset()`, or it breaks
under a subfolder deploy.

**Skill auto-matching is deliberately conservative.** `skillLinks.ts` will not
treat "simulation" as Simul8, SQLite as MySQL, or Scilab as MATLAB. This section
makes factual claims about your work — better to under-match and tick the extra
project by hand than to defend a wrong one in an interview.

**Use `loopOn()` for perpetual animations,** not `on()`, so they stop on phones.

**Deleting an upload doesn't unlink it.** Always `npm run check-assets` — or
just let `npm run publish` do it for you.

---

## 11. Troubleshooting by symptom

**Publish stops at "Checking uploaded files".** Config points at deleted files.
Re-upload them, or run `npm run fix-assets` to drop the links.

**Publish stops at "Building".** A TypeScript error. The message names the file
and line. Nothing was committed.

**Live site is blank, console shows 404s for `/assets/…`.** The base path is
wrong. Check the "Resolve base path" step in the Actions log — it prints what it
chose and why. Usually the repo was renamed.

**Live site shows the README instead of the site.** Pages is set to "Deploy from
a branch". Switch it to GitHub Actions.

**Images broken on the live site but fine locally.** Either the files weren't
committed (check `git status` for untracked files in `public/`), or a config
path isn't going through `asset()`.

**An admin edit didn't appear on the site.** You saved the config but didn't
publish. `Ctrl+S` writes to disk; `npm run publish` ships it.

**A save shows the amber conflict banner.** Another tab, or a script, wrote the
config after this tab loaded it. **Load disk version** discards your unsaved
edits; **Keep mine** then Save overwrites theirs.

**Phone feels slow.** Confirm the low-power tier is active — in a mobile
browser, `document.documentElement.classList.contains('low-power')` should be
`true`. You can also lower the ether brightness, or switch Liquid Ether off
entirely, in admin → Animations.

**Animations don't run at all.** Either the OS has "reduce motion" enabled —
which the site respects on purpose and cannot be overridden — or the Animations
preset is set to **Static**.
