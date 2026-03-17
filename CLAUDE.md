# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at http://localhost:5173
npm run build     # type-check (tsc -b) then bundle with Vite
npm run lint      # ESLint across all .ts/.tsx files
npm run preview   # serve the production build locally
```

There are no tests configured yet.

## Stack

| Layer | Package |
|-------|---------|
| Bundler | Vite 8 |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Backend / realtime | `@supabase/supabase-js` |

## Tailwind v4 setup

Tailwind is loaded as a Vite plugin — **no `tailwind.config.*` file exists**.
The only required entry point is the single import in `src/index.css`:

```css
@import "tailwindcss";
```

Theme customisation and `@layer` rules go directly in `src/index.css` using CSS custom properties and the `@theme` block (v4 API), not a JS config file.

## TypeScript strictness

`tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`.
The build fails on unused imports/variables — keep imports clean.

## Project conventions

- React components go in `src/components/`
- Game state (Zustand / Context / reducers) goes in `src/store/`
- Variable and file names in **English**; comments in **Polish**
- Do not install new UI libraries without asking first

## Dependency note

`@tailwindcss/vite` currently supports Vite ≤ 7; it was installed with `--legacy-peer-deps` because the project uses Vite 8. Use that flag for any future installs if peer-dep conflicts arise.
