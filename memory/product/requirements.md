# Requirements: Frameroom

## Core Value
"Build an open-source, self-hostable web app for photographers called "[Frameroom]". It replaces paid gallery tools like Pixieset and ShootProof."

## Stack (required by user, must be easy to self-host)
- Next.js (TypeScript) + Tailwind
- SQLite by default, Postgres optional via env var
- S3-compatible storage for photos, with local disk as the default
- Docker + docker-compose, with a .env.example

## Personas & Roles
- Photographer (single owner, set up on first run)
- Client (views gallery via share link, optional password)

## Features (SLICE 1 ONLY — do not build more yet)
1. Photographer signup/login (single-owner setup on first run)
2. Clients: add, edit, and list clients (name, email, notes)
3. Galleries: create a gallery for a client, upload multiple photos with thumbnails
4. Share link: each gallery gets a unique URL with an optional password
5. Client view: a clean, mobile-friendly grid with a lightbox and a download-all button
- Studio branding in settings: logo, name, accent color
- Image uploads: limit file size and type, generate thumbnails

## Critical user flow
Photographer sets up account on first run -> adds client -> creates gallery and uploads photos -> shares link (optional password) -> client opens link, browses grid/lightbox, downloads all.

## UI/UX Rules
- Clean, minimal, modern UI
- Client view mobile-friendly

## Edge Cases
- Galleries must be inaccessible without the link/password

## Deliverables
- Dockerfile, docker-compose.yml, .env.example
- README with a one-paragraph description, features list, setup steps, and a placeholder for a "Deploy to Hostinger" button at the top
- MIT license

---
# Round 2: One-click / non-developer setup (user's words, verbatim)
"Target user: photographers who need a one-click hosted option. They are not developers
and won't follow technical steps. Design for that:
- Setup must work with minimal configuration: sensible defaults, and only a few
  required env vars (admin email, password, app URL).
- A first-run setup wizard in the browser: create the studio account, upload a logo,
  pick a color. No file editing.
- SQLite and local disk storage by default, so no external services are required.
  S3 and Postgres stay optional for advanced users.
- Email (SMTP) and Stripe should be optional, set up later from the settings page.
- Clear, friendly error messages instead of technical ones.
Technical users can still self-host with Docker from the README, but the one-click
deploy experience is the priority."

## Round 2 decision: owner account creation (user's words, verbatim; overrides "admin email, password" env vars above)
"Do not require admin email or password as environment variables. On first run, show a
setup wizard in the browser to create the owner account. After the first account is
created, permanently disable the wizard. Optionally support a SETUP_CODE env var; if set,
the wizard requires it before allowing account creation."

## Round 2 decision: pricing / scope guardrail (user's words, verbatim)
"Pricing: Frameroom is free and open source (MIT). There is no paid hosted version.
It will be listed on Hostinger's open source partners program with a "Deploy to
Hostinger" button, so don't build any billing, plans, or multi-tenant features."

## Round 2 decision: payments (user's words, verbatim; overrides "Stripe ... set up later from the settings page" above)
"Drop Stripe and all payment features for now. Do not build print sales, extra-download
purchases, invoices, or checkout in slice 1 or 2.

Keep the code structure ready for it later: photographers will eventually connect their
OWN Stripe account (their own API keys, entered in the settings page, optional), so
Frameroom never handles anyone's money itself. Don't build that yet.

Focus on: galleries, client share links, and proofing."

---
# Round 3: Proofing (user's words, verbatim) — send after Round 2 finishes
"Support both modes with a single optional setting per gallery: "Max selections".

- If no limit is set: clients can heart as many photos as they like (simple favorites).
- If a limit is set (for example 30 for an album): show a live counter ("12 of 30
  selected"), stop the client from selecting more once the limit is reached, and show a
  friendly message explaining why.
- In both modes, clients can add a short comment on any photo.
- Clients enter their name and email once (no account needed).
- A "Submit selections" button locks the list and emails the photographer.
- The photographer can reopen a submitted selection if the client needs changes.
- Photographer dashboard: a "Selections" tab per gallery with the chosen photos,
  comments, and a CSV export of filenames (for Lightroom).

Keep the client view mobile-first."

## Round 3 decision: notifications & optional email (user's words, verbatim)
"Email (SMTP) is optional. Submitted selections must never depend on it.

1. Always show an in-app notification when a client submits selections: a badge on the
   gallery, a "New selections" item on the dashboard, and an unread indicator until the
   photographer opens it.
2. If SMTP is not configured, show a dismissible banner on the dashboard and the
   gallery's Selections tab: "Want an email when clients submit? Set up email in
   Settings." Link it to the settings page. Once dismissed, do not nag again, but keep a
   small note in Settings.
3. If SMTP is configured, send the email in addition to the in-app notification.
4. If an email fails to send, still save the submission, show the in-app notification,
   and log the error with a clear message in Settings (no crash).
5. In Settings, add an email setup form with a "Send test email" button and plain-language
   help (no technical jargon).
6. Clients are never told whether email is configured. They just see "Selections
   submitted. Your photographer has been notified.""

---
# Round 4: Demo mode (user's words, verbatim) — send after Round 3 finishes
"Add an optional demo mode, enabled with DEMO_MODE=true, that seeds a sample studio:

- Studio name "Lumen & Co. Photography" with a simple logo and accent color
- 3 sample clients, e.g. "Priya & Daniel" (wedding), "The Okafor Family" (portraits),
  "Northwind Cafe" (brand shoot)
- 3 galleries with 20-30 photos each, using the images in /demo-photos
- One gallery with a selection limit (e.g. 30) and a few photos already hearted with comments
- One submitted selection showing in the dashboard
- Demo share link password shown on the login screen

Demo mode must be off by default, and the seed must not run if real data exists."
NOTE: /demo-photos does not exist in the environment yet (pending user decision on photo source).

## Round 4 decision: demo photo source
User chose: "Use free stock photos from Unsplash or Pexels" — credits go in /demo-photos/CREDITS.md.

## Round 4: Project-wide requirements (user's words, verbatim) — apply/verify across the whole app
"- App name: Frameroom. Tagline: "Your studio's gallery and proofing, self-hosted, no subscription."
- License: MIT.
- Deployment: must run with one `docker compose up -d`, using SQLite and local disk storage by default. Add a health check endpoint and persist data in a Docker volume so photos and the database survive restarts.
- Uploads: handle large batches (50+ photos, up to ~25 MB each) with a progress bar, generate thumbnails, strip GPS location data from the client-facing images, and keep the original files for download.
- Security: rate-limit gallery password attempts, use unguessable share URLs, no default credentials, and keep secrets out of the repo.
- Design: clean, minimal, mobile-first, with light and dark mode. Photos are the focus.
- Repo files: README (description, features, quick start, and a placeholder at the top for a "Deploy to Hostinger" button), .env.example, LICENSE, CONTRIBUTING.md, and a /demo-photos/CREDITS.md.
- Scope: build slice 1 first, then proofing. No payments, no multi-user or multi-tenant features, no billing.
- Keep the code clean and commented so open-source contributors can follow it."

---
# Round 5: Selections CSV export & notes (user's words, verbatim) — send after Round 4 finishes
"CSV export should include every photo that is either selected OR has a comment.

Columns: filename, selected (yes/no), comment, client_name, client_email, submitted_at

- Selected photos without comments: included, comment column empty.
- Commented photos that were not selected: included with selected = "no".
- Photos with neither: excluded.
- Sort selected photos first, then commented-only photos.
- Keep a second export option, "Selected only", for importing the picks list into
  Lightroom.

In the Selections tab, show commented-but-unselected photos in a separate section called
"Notes on other photos", so the photographer doesn't miss them."

---
# Round 6: Self-serve trial + problem reporting (user's words, verbatim) — send after Round 5 finishes
"For now, make the demo mode and setup wizard good enough that someone can try the app without my help, and add a "Report a problem" link in Settings that opens a GitHub issue."
