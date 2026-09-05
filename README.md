# OUAQT Marketing Site

Marketing site for OUAQT: custom business systems for companies still running
on paper, Excel, and WhatsApp. Built with Next.js 14 (App Router), TypeScript,
Tailwind CSS, and Framer Motion.

Content is sourced from the OUAQT pitch deck. Five live systems across mining,
pharmacy, hospitality, transport, and food service.

**On metrics:** only the GMM mining figures (4 hrs to 25 min, 90% reduction) are
client-confirmed. The other four projects deliberately carry no hard numbers.
`TODO(adel)` markers in `lib/data/projects.ts` show where to add real measured
results once you have them. Please don't publish estimates as facts.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project structure

```
app/
  layout.tsx                root layout: fonts, theme provider, navbar, footer
  page.tsx                  home
  about/page.tsx            about + team + values
  contact/page.tsx          contact form + details
  projects/page.tsx         projects index with category filter
  projects/[slug]/page.tsx  project detail (statically generated per project)
  not-found.tsx             404
components/
  ui/                       Button, Card, Container, Section
  motion/                   FadeIn, PageTransition, GradientMesh
  home/                     Hero, ImpactBar, Problem, Pillars, Proof,
                            FeaturedProjects, AboutTeaser
  projects/                 ProjectCard, ProjectsGrid
  contact/                  ContactForm
  navbar.tsx, footer.tsx, theme-provider.tsx, theme-toggle.tsx
lib/
  utils.ts                  `cn()` class merge helper
  data/projects.ts          the five live systems (typed)
  data/founder.ts           founder bio, credentials, contact details
public/images/README.md     where to drop project photos and the headshot
```

## Adding project photos

See [`public/images/README.md`](public/images/README.md). Short version: drop
files into `public/images/projects/<slug>/`, then set `coverImage` and
`gallery` on that project in `lib/data/projects.ts`. Cards and detail pages
switch from gradient placeholders to real photos automatically.

## Customizing

Everything you'll want to change is marked with a `TODO(customize)` comment.
Run `grep -rn "TODO(customize)" app components lib` to find them all.

**Colors.** The accent is defined once in `tailwind.config.ts` (currently
`#C9A961`, a muted champagne gold). Two alternates are suggested in a comment
there: deep emerald `#10B981` and electric lime `#C4F042`. Light/dark base
colors live as CSS variables at the top of `app/globals.css`.

**Fonts.** `app/layout.tsx` loads Inter via `next/font/google`. To switch to
Geist or General Sans, replace that import and update the `--font-inter`
variable reference in `tailwind.config.ts`.

**Content.** The five systems live in `lib/data/projects.ts` and founder details
in `lib/data/founder.ts`. Both are fully typed, so pages update automatically
when you edit the data. Home page copy lives in the `components/home/` sections.

**Images.** Real photo support is wired up via `next/image`. Projects without a
`coverImage` fall back to a neutral placeholder. See `public/images/README.md`.

## Dark mode

Handled by `next-themes` with `attribute="class"`. Defaults to dark, and the
toggle lives in the navbar. Change `defaultTheme` in `app/layout.tsx` to
`"light"`, or set `enableSystem` to `true` to follow the OS setting.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. `.env.local` is
gitignored, so never commit real secrets there.

The contact form (`components/contact/contact-form.tsx`) validates client-side
and shows a success state, but has **no backend**. Wire it to an API route or
form service when you're ready.

## Deploying

Deploy-ready for Vercel: import the repo, accept the defaults, and add any
environment variables from `.env.example` in the project settings.
