# Portfolio — Mohammed Amine TALHI

Personal portfolio site. React + TypeScript + Vite, Tailwind CSS v4, Framer Motion,
and a set of [React Bits](https://reactbits.dev) components vendored into `src/components/reactbits/`.
Content comes from **ResumeApp** (`../ResumeApp/data/master.json`), plus a local-only
admin panel for everything the CV doesn't carry.

Live at **https://user-encryptionpy.github.io** once deployed.

---

## Quick start

```bash
npm install
npm run sync      # pull the latest CV data out of ResumeApp
npm run dev       # site at http://localhost:5173 · admin at /#/admin
```

| Command | What it does |
| --- | --- |
| `npm run sync` | Reads `../ResumeApp/data/master.json` → writes `src/data/resume.json` and reconciles the admin config |
| `npm run dev` | Dev server **plus** the admin panel |
| `npm run build` | Static production build into `dist/` — **no admin code included** |
| `npm run preview` | Serve the production build locally to check it |

---

## How the content works

Two files drive everything:

**`src/data/resume.json`** — generated, never edit by hand.
Regenerate with `npm run sync` whenever you change your CV in ResumeApp.

**`src/data/portfolio.config.json`** — your choices, written by the admin panel:
contact details, CV files, project visibility/order/documents, the skills toolbox,
leadership entries, visit photos, and the animation settings.

`npm run sync` is safe to re-run: it adds new projects (visible by default),
prunes deleted ones, fills in any config block added by a newer version of the
script, and leaves every choice you already made untouched.

---

## The admin panel

**http://localhost:5173/#/admin** while `npm run dev` is running. `Ctrl+S` saves.

| Tab | What you can do |
| --- | --- |
| **Projects** | Show/hide and reorder each synced project. Attach a **report, presentation, poster, code link or plain link** per project — upload the PDF/PPTX or paste a URL. Cover image, tech-stack chips. Add custom projects. |
| **Skills** | Build the About toolbox: add/remove/reorder skills, rename them, assign a colour family, and pick an icon from a **searchable 104-icon library**. Live preview of the real grid. |
| **Leadership** | Clubs, basketball, associations — bilingual, multi-photo, colour accent. 🏀 and 🎓 presets. |
| **Visits** | The EMINES post link, trip photos, and per-visit photos/links for each industrial visit. |
| **Profile** | Photo, headline, intro paragraphs, and which experiences appear in the timeline. |
| **Contact & CV** | Phone, second phone, both emails, location, LinkedIn/GitHub (URL + label). Upload **one CV per language** — a visitor reading the site in French is offered the French CV *only*, and switching to English swaps it. A language with no file uploaded shows no button at all. |
| **Animations** | Four presets (Subtle / Balanced / Showcase / Static), a global speed slider, a **Liquid-ether brightness slider** (dark ↔ bright, with a live swatch), the hero-name effect, and a switch per animation — each with a **live thumbnail of the real animation** at your current speed. |

### Why it never reaches the internet

Two independent locks:

1. **The UI** sits behind `import.meta.env.DEV` in `src/App.tsx`. Vite resolves that
   to `false` at build time, so the panel is tree-shaken out entirely.
2. **The write API** is a Vite plugin marked `apply: 'serve'` — it exists only in
   the dev server. GitHub Pages serves static files and has nothing to write with.

Verified after every build: no admin string survives into `dist/`.

**You do need to commit `src/data/portfolio.config.json` and your uploaded files** —
that's the content the live site reads.

### Concurrent edits

The admin loads the config from disk on mount and remembers its timestamp. If the
file changed underneath you (another tab, a script), saving returns a conflict and
you get a banner offering **Load disk version** or **Keep mine** — it will not
silently overwrite.

---

## Uploads

| Folder | Holds | Set from |
| --- | --- | --- |
| `public/` | `profile.jpg` | Profile tab |
| `public/covers/` | project cover images | Projects → Details |
| `public/docs/` | project reports, decks, posters | Projects → Details → Documents |
| `public/cv/` | `CV-…-EN.pdf`, `CV-…-FR.pdf` | Contact & CV |
| `public/leadership/` | club and basketball photos | Leadership |
| `public/visits/` | industrial-visit photos | Visits |

Images: jpg/jpeg/png/webp/gif/avif. Documents: pdf/pptx/ppt/docx/doc/xlsx/zip. 60 MB cap.

---

## Deploying

### What your URL can be

The `something.github.io` part is issued **per GitHub account, not per repository**.
With the username `user-encryptionpy` the only github.io host you can have is
`user-encryptionpy.github.io` — naming a repo `portfolio` adds a path, it does not
change the subdomain.

| What you do | Resulting URL | Cost |
| --- | --- | --- |
| Repo named `portfolio` | `user-encryptionpy.github.io/portfolio/` | free |
| Repo named `user-encryptionpy.github.io` | `user-encryptionpy.github.io` | free |
| **Rename the GitHub account** to e.g. `mohammedtalhi`, repo `mohammedtalhi.github.io` | `mohammedtalhi.github.io` | free |
| **Custom domain** + `public/CNAME` | `mohammedtalhi.com` | ~$10–15/yr |
| Host on Netlify or Vercel instead | `mohammedtalhi.netlify.app` | free |

Renaming the account is the only free way to get *your name* on a github.io host.
GitHub redirects the old username, though any links you have already shared to
`user-encryptionpy/...` are worth updating.

### The base path is handled for you

A project page is served from a subfolder, which breaks every absolute path unless
the build knows about it. `.github/workflows/deploy.yml` works the prefix out from
the repository name — `/` for a user page or a custom domain, `/<repo>/` otherwise —
and `src/lib/asset.ts` applies it to the upload paths stored in the config, which
Vite cannot rewrite on its own. Nothing to configure either way.

### Setting it up

1. Create the repo (any name — `portfolio` is fine).
2. Push this folder to its `main` branch.
3. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

For a custom domain, add a file `public/CNAME` containing just the domain, point
the DNS at GitHub, and the workflow switches the base path to `/` for you.

**Everyday flow:**

```bash
npm run sync && npm run dev
```

...edit in `/#/admin`, save, then:

```bash
git add -A && git commit -m "Update portfolio" && git push
```

## Structure

```
scripts/sync-resume.mjs        ResumeApp → resume.json (+ config migration)
src/data/resume.json           generated CV data (do not edit)
src/data/portfolio.config.json your admin choices (commit this)
src/lib/
  anim.ts                      animation settings + presets, read by every component
  iconRegistry.ts              the 104-icon library behind the skill picker
  skills.ts                    resolves config skills → icon components
  data.ts, i18n.tsx, types.ts
src/components/
  reactbits/                   SplitText, BlurText, ShinyText, GradientText,
                               CountUp, AnimatedContent, SpotlightCard,
                               Magnet, ClickSpark
  about/                       ProfileCard, SkillsPanel, FlowConsole,
                               ExperienceTimeline, EducationPanel,
                               VisitsPanel, LanguagesPanel
src/admin/                     local-only content manager (dev only)
vite.config.ts                 build config + the dev-only admin API
```

## Notes

- **React Bits** is a copy-in library (like shadcn/ui), not an npm dependency. The
  `reactbits` name on npm is unrelated, and the third-party mirror lists three.js,
  GSAP, Chakra and matter-js as peers. The components live in
  `src/components/reactbits/index.tsx` and are yours to edit.
- The hero is **centred**, and the name stays on **one line** from 320 px to
  1920 px (measured), via `whitespace-nowrap` and a viewport-scaled `clamp`.
- **StrokeText** draws the name as an outline whose letters fill with amber as a
  band sweeps through. The glyphs exist once in the DOM — the fill is a `::after`
  pseudo element using `content: attr(data-text)`, because stacking two real
  spans made the `<h1>` read the name twice to crawlers. See `.stroke-text` in
  `src/index.css`.
- **LiquidEther** is the animated background: fBm noise through two rounds of
  domain warping, tinted amber, with a decaying bulge that follows the cursor.
  It is written straight against WebGL (no three.js) — about 2 kB of shader
  source. Brightness is the admin slider; the dark scrim over it tracks the same
  value, so "darker" really is darker. Falls back to the CSS blooms with no
  WebGL, and paints one frame synchronously so a background tab is never black.
- Visits render as **single-line rows** — organisation, place, and a truncated
  description — rather than wrapping paragraphs. Languages sit directly beneath.
- Two projects (the e-fuels study and the greenhouse optimization) have no `tag`
  in ResumeApp, so they appear under "All" but match no filter chip. Add a tag in
  ResumeApp and re-run `npm run sync`.
- Animations respect `prefers-reduced-motion` regardless of the admin settings.
- Bundle is ~175 kB gzipped; ~26 kB of that is the icon library that powers the
  skill picker.
