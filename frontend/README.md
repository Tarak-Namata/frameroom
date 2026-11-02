<p>
  <a href="https://www.hostinger.com/docker-hosting?compose_url=https://raw.githubusercontent.com/Tarak-Namata/frameroom/main/docker-compose.yml"><img alt="Deploy on Hostinger" src="https://assets.hostinger.com/vps/deploy.svg" /></a>
</p>

# Frameroom

**Your studio's gallery and proofing, self-hosted, no subscription.**

[GitHub](https://github.com/Tarak-Namata/frameroom) · [Report a problem](https://github.com/Tarak-Namata/frameroom/issues) · MIT licensed

Frameroom is a free, open-source client gallery app for photographers, an alternative to Pixieset and ShootProof that you own. Upload a shoot and send your client a private link, with a password if you like. Clients get a clean, mobile-friendly gallery where they can heart favorites, leave comments, submit their picks and download everything. Deploy it with one click and finish setup in your browser. There are no files to edit and no other services to sign up for.

> **Want to look around first?** Set `DEMO_MODE=true` on a fresh install. It fills Frameroom with a sample studio, three galleries and some client selections. The login and setup screens then show a short "try it yourself" guide with the demo gallery link and password, so anyone can explore without help. For a public demo, leave `SETUP_CODE` unset so the first visitor can create the account.

## One-click setup (recommended)

1. Click **Deploy on Hostinger** above.
2. When asked for settings, enter your **APP_URL** (the web address of your gallery site, e.g. `https://gallery.yourstudio.com`). That's the only setting we recommend. Everything else has sensible defaults.
3. Open your Frameroom address. A short setup wizard walks you through:
   - creating your studio account (you're the only owner),
   - uploading your logo,
   - picking your brand color.
4. Done. A "Getting started" checklist on your dashboard walks you through adding a client, creating a gallery, uploading photos and sharing the link.

After the first account is created, the setup wizard is switched off for good.

Something not working? Use **Settings → Report a problem**. It opens a pre-filled [GitHub issue](https://github.com/Tarak-Namata/frameroom/issues) with your version and setup type, and never includes your photos or passwords.

> **Optional: setup code.** If your site will be public before you finish setup, add a `SETUP_CODE` setting (any phrase). The wizard will then ask for that code before anyone can create the owner account. After 5 wrong codes the wizard pauses for 15 minutes.

Email (SMTP) is optional. You can connect it any time later from **Settings → Email**, with no restart needed.

## Features

- **Browser setup wizard**: account → logo → color. No admin passwords in config files.
- **Secure sign-in**: hashed passwords, httpOnly session cookies, and a lockout after 5 failed attempts.
- **Clients**: add, edit and list clients (name, email, notes).
- **Galleries**: create a gallery for a client and drag in many photos at once, with upload progress.
- **Thumbnails**: generated automatically. Originals are kept for download.
- **Location privacy**: GPS coordinates are removed from every uploaded photo, including the original your client downloads. Image data and other camera details are left untouched.
- **Upload limits**: JPEG / PNG / WebP up to 25 MB each, checked on the server.
- **Private share links**: each gallery gets an unguessable URL, with an optional password.
- **Client view**: responsive grid, full-screen lightbox (keyboard and swipe), single-photo download and **Download all** as a ZIP.
- **Studio branding**: logo, studio name and accent color.
- **Proofing / selections**: clients heart favorites (unlimited, or with a per-gallery "Max selections" limit and a live "12 of 30 selected" counter). They can comment on any photo, enter their name and email once (no account), and press **Submit selections** to lock the list. You can reopen it and see picks and comments in a Selections tab. Comments on photos the client didn't select appear under "Notes on other photos". **Export CSV** gives every selected or commented photo (filename, selected, comment, client_name, client_email, submitted_at). **Selected only** gives just the picks' filenames, for Lightroom.
- **Notifications**: in-app badges and a "New selections" list on your dashboard always work. If email is set up, you also get an email, and a failed email never loses a submission.
- **Optional email (SMTP)**: configure it in Settings, with a "Send test email" button.
- **Friendly errors**: plain-language messages instead of technical ones.
- **Light and dark mode**: follows your device, with a toggle in the admin area and client galleries.
- **Large uploads**: drop 50+ full-size photos at once. They upload a few at a time, with progress and an automatic retry.
- **Health check**: `GET /api/health` returns 200 when the app and database are OK. Docker's `HEALTHCHECK` uses it.
- **No external services required**: the built-in SQLite database and local disk storage work out of the box. Postgres and S3 are optional.

## Self-hosting with Docker (for technical users)

```bash
git clone https://github.com/Tarak-Namata/frameroom.git
cd frameroom
cp .env.example .env      # optional — edit APP_URL
FRAMEROOM_BUILD_CONTEXT=. docker compose up -d --build
```

Without `FRAMEROOM_BUILD_CONTEXT=.`, Compose builds the image straight from the GitHub repo. That's how the one-click deploy works with just `docker-compose.yml`.

Open <http://localhost:3000> and follow the setup wizard. Everything is stored in the `frameroom-data` volume: the database, photos, and an auto-generated session secret.

### Configuration

No variables are required. See [`.env.example`](.env.example).

| Variable | Default | Description |
| --- | --- | --- |
| `APP_URL` | address you first open | Public URL used in share links (recommended) |
| `SETUP_CODE` | — | If set, the setup wizard requires this code |
| `DEMO_MODE` | `false` | `true` fills an empty install with a sample studio (never touches existing data). The photos in `demo-photos/` are credited in `demo-photos/CREDITS.md` |
| `DATA_DIR` | `./data` (`/app/data` in Docker) | Database, uploads and generated secret |
| `SESSION_SECRET` | auto-generated | Override the generated session secret |
| `DATABASE_URL` | SQLite in `DATA_DIR` | Set to `postgresql://…` to use Postgres |
| `STORAGE_DRIVER` | `local` | `s3` to use S3-compatible storage |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` | — | S3 settings |
| `MAX_UPLOAD_MB` | `25` | Max size per photo |

**Postgres:** set `DATABASE_URL=postgresql://user:pass@host:5432/frameroom`. Frameroom detects it, switches to `prisma/postgres/schema.prisma` and creates the tables on startup. A commented-out Postgres service is included in `docker-compose.yml`.

**S3:** set `STORAGE_DRIVER=s3` plus the `S3_*` values. Photos are always streamed through Frameroom, so your bucket can stay private.

**Security note:** saved email passwords are encrypted with a key derived from the session secret. If you replace `SESSION_SECRET` (or delete the data volume's `.session-secret`), re-enter your email password in Settings.

## Local development

Requires Node.js 20+ and Yarn.

```bash
yarn install
yarn start        # prepares the database, then runs next dev (NODE_ENV=production runs next start)
```

## Tech stack

Next.js (App Router, TypeScript) · Tailwind CSS · Prisma (SQLite / Postgres) · sharp · archiver · Nodemailer · AWS SDK v3 (S3).

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the ground rules, the project layout and how to run it locally. Found a bug? [Open an issue](https://github.com/Tarak-Namata/frameroom/issues).

## License

Frameroom is free and open source under the [MIT](LICENSE) license. There is no paid version.
