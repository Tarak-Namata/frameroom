# Frameroom — PRD

## Original problem statement
Read /app/memory/product/requirements.md and build it. Next.js (TypeScript) + Tailwind, SQLite/Prisma, Docker deliverables. Open-source, self-hostable photographer gallery app (Pixieset/ShootProof alternative). Slice 1 only.

## User choices
Real Next.js + Prisma running on the preview port; bcrypt + httpOnly session; local disk + S3 driver; JPEG/PNG/WebP, 25 MB; clean, minimal, light, editorial; open-source project.

## Architecture
- /app/frontend = the Next.js 15 app (App Router, TS, Tailwind 3, Prisma 6, sharp, archiver 8, jose, bcryptjs, AWS SDK v3)
- `yarn start` -> scripts/start.mjs (prisma generate + db push, then `next dev`, or `next start` when NODE_ENV=production)
- Prisma: prisma/schema.prisma (sqlite) + prisma/postgres/schema.prisma, picked automatically from DATABASE_URL
- Storage: src/lib/storage.ts (local or s3); thumb 640px + large 2000px WebP; original kept
- /app/backend/server.py is a PREVIEW-ONLY proxy: ingress sends /api to :8001, which forwards to Next on :3000
- Deliverables in /app/frontend: Dockerfile, docker-compose.yml, .env.example, README.md (Hostinger button placeholder), LICENSE (MIT)

## Implemented (2026-11-01)
- Single-owner first-run setup, login/logout, brute-force lockout keyed per email and per gallery
- Clients add/edit/delete/list/search
- Galleries: create for a client, multi-upload with progress, thumbnails, photo delete, edit details, delete
- Share link (random slug) + optional password (signed per-gallery cookie, invalidated when the password changes)
- Public view: hero, justified grid, lightbox (keys/swipe), per-photo download, download-all ZIP
- Branding: logo, studio name, accent color
- Tested: iteration_1 (backend 20/22 before fixes, frontend 100%); the reported bugs were fixed afterwards

## Round 2 — one-click / non-developer setup (2026-11-01)
- Zero required env vars. Session secret auto-generated in DATA_DIR/.session-secret; SQLite + local disk defaults; APP_URL recommended (otherwise the setup request origin is stored and editable in Settings → General)
- Browser setup wizard: optional SETUP_CODE step → account → logo → color. Owner is created with a fixed id 'owner', so only one can ever exist and the wizard is permanently disabled
- Optional SMTP in Settings → Email (password AES-GCM encrypted, test email with friendly error mapping)
- Friendly error messages (client mapping, route safe() wrapper, error.tsx/global-error.tsx, start-script hints)
- Guardrails: no payments/Stripe/billing/plans/multi-tenant (Stripe was removed per the user's decision)
- Tested: iteration_2, 41/41 backend and all frontend flows; minor issues fixed afterwards

## Round 3 — Proofing (2026-11-01)
- Per-gallery optional maxSelections; clients heart photos with a live counter and limit enforced on the client and server; comments on any photo; name + email entered once (signed cookie per gallery, re-attaches by email); Submit locks the list; photographer can Reopen
- Selections tab per gallery (cards, comments, CSV export, copy filenames); in-app notifications: dashboard "New selections", gallery card badge, nav badge, tab badge (marked read when the tab is opened)
- Email optional: dismissible banner (dashboard + Selections tab) when SMTP isn't set up, plus a note in Settings; when SMTP is configured, an email is sent in the background after the response; failures are logged in Settings (lastEmailError) and never affect the submission
- Tested: iteration_3, 16/16 new + 41/41 regression, all frontend flows pass

## Round 4 — Demo mode & project-wide polish (2026-11-02)
- DEMO_MODE=true seeds an empty install once (studio "Lumen & Co.", 3 clients, 3 galleries / 78 Unsplash photos in /demo-photos with CREDITS.md, sample selections); skipped if any data exists; demo link + password on login/setup
- GPS stripped losslessly from originals (JPEG/PNG/WebP, pixels identical, camera EXIF kept) — verified with scripts/test-strip.mjs
- Light/dark mode via CSS-variable neutral palette + accent contrast vars; toggle in admin, auth and client gallery
- Tagline, CONTRIBUTING.md, /api/health checks DB, upload retry, header comments

## Round 5 — Selections CSV & notes (2026-11-02)
- Export CSV = every selected OR commented photo (filename, selected, comment, client_name, client_email, submitted_at), selected first; "Selected only" = filename list for Lightroom
- Selections tab shows commented-but-unselected photos under "Notes on other photos"

## Round 6 — Self-serve trial, Report a problem, repo (2026-11-02)
- REPO_URL constant (src/lib/repo.ts, override NEXT_PUBLIC_REPO_URL) = https://github.com/Tarak-Namata/frameroom used in README, footers (auth, client gallery, admin nav), Report a problem, Deploy button
- Settings → "Report a problem" opens a pre-filled GitHub issue (version, DB type, storage, email/demo flags, browser — no secrets)
- Self-serve: DemoCard "try it yourself" 2-step guide (client view + owner side; explains when the owner is already claimed); wizard copy clarified + password show/hide; dashboard "Getting started" checklist (auto-hides when done)
- Deploy on Hostinger button (official compose_url format); docker-compose builds from the GitHub repo by default (FRAMEROOM_BUILD_CONTEXT=. for local)
- Repo root = /app/frontend; .gitignore covers node_modules, .next, .env*, data/, uploads, *.db, .session-secret; dry-run shows 208 files, no secrets

## Backlog
- P1: styled confirm modal (replaces native confirm()), regenerate share link, gallery cover choice, photo reordering
- P2 (later slices): favorites/proofing, expiry, watermarking, email notifications, print store
