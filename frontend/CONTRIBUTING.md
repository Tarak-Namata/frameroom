# Contributing to Frameroom

Thanks for helping! Frameroom is a free, MIT-licensed gallery and proofing app for photographers. It's built so that someone who isn't a developer can run it with one click.

## Ground rules

- **Keep it simple to host.** There's one container, SQLite and local disk by default, and no required environment variables. New features must not need an external service in order to work.
- **Friendly errors.** Anything a photographer or client sees should be plain language. Technical details go to the server log.
- **Out of scope for now:** payments, billing or plans, multi-user and multi-tenant features. Please open a discussion before working on anything in these areas.
- **Photos are the focus.** The UI stays clean and minimal, works mobile-first, and supports light and dark mode.

## Getting started

```bash
yarn install
cp .env.example .env        # optional
yarn start                  # creates ./data, syncs the database, runs `next dev` on :3000
```

Set `DEMO_MODE=true` on an empty `./data` folder to get a sample studio to click through. Delete `./data` to start over.

## Project layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Next.js App Router pages (`admin/`, `g/[slug]` client view, `setup/`, `login/`) and API routes (`api/`) |
| `src/components/` | UI. `public/` is the client gallery, `settings/`, `setup/` and `selections/` are admin features |
| `src/lib/` | Server logic: `db` (Prisma), `auth`/`session`, `storage` (local/S3), `images` (thumbnails), `strip-location` (GPS removal), `proofing`, `email`, `demo-seed` |
| `prisma/` | `schema.prisma` (SQLite) and `postgres/schema.prisma`. **Keep both in sync** |
| `scripts/` | `start.mjs` (startup: database sync, then Next.js) and `prisma.mjs` (picks the right schema) |
| `demo-photos/` | Stock photos for demo mode, credited in `CREDITS.md` |

## Conventions

- TypeScript and Tailwind. Use the shared `btn-*`, `field`, `label` and `caption` classes from `globals.css`.
- Colors: use `neutral-*`, `surface` and `paper`. They switch automatically in dark mode. Use `var(--studio-accent)` with `var(--studio-accent-fg)` for brand-colored elements.
- API routes return `{ error: "friendly message" }` on failure. Wrap new handlers in `safe()` from `src/lib/errors.ts`.
- Every interactive element gets a kebab-case `data-testid`.
- Keep components small, and add a short comment where the intent isn't obvious.

## Database changes

Edit **both** Prisma schemas. The schema is applied with `prisma db push` on startup, so additive changes (new optional fields or models) are safe for existing installs.

## Pull requests

1. Fork the repo and create a branch.
2. Make sure `npx tsc --noEmit` passes.
3. Describe what changed and how you tested it, with screenshots for UI changes.

By contributing, you agree that your contributions are licensed under the MIT License.
