# Welcome Aboard — Dynamic Generator

Next.js (App Router) + MongoDB application that replaces the static Welcome
Aboard card with a login-gated dashboard, a dynamic employee form, a live
preview that renders the exact email HTML, and one-click sending to selected
recipients.

## Stack

- Next.js 14 (App Router, TypeScript)
- MongoDB / Mongoose (connection string supplied via `MONGO_URI`)
- JWT session cookies (`jose` for edge middleware, `jsonwebtoken`/`bcryptjs` for API routes)
- Nodemailer (Gmail) for sending mail
- Tailwind CSS
- `xlsx` for CSV/Excel export

> The spec text mentioned PostgreSQL, but the provided `MONGO_URI` env var
> points at MongoDB — this build follows the env var and uses Mongoose models
> instead of SQL tables. If you actually want PostgreSQL, say so and the data
> layer can be swapped (the API route bodies stay the same, only `src/models`
> and `src/lib/db.ts` change).

## Setup

```bash
npm install
cp .env.local.example .env.local   # or edit the existing .env.local
npm run seed                       # creates an admin user
npm run dev
```

Default seeded admin (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
before running `npm run seed`):

```
email: admin@mitraindustries.com
password: ChangeMe123!
```

Change this password immediately via Forgot Password in production.

## Environment variables (`.env.local`)

| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign session cookies — set a long random value in production |
| `MAIL_USER` / `MAIL_PASS` | Gmail account + app password used by Nodemailer |
| `NEXT_PUBLIC_APP_URL` | Public base URL, used to build absolute image/logo links inside outgoing emails |

## App structure

- `src/app/login`, `forgot-password`, `reset-password` — public auth pages.
- `src/app/(app)/dashboard` — announcement list, create (`/new`), edit/view (`/[id]`). Protected by `src/middleware.ts`.
- `src/app/(app)/users` — user management: search, filter, sort, paginate, CSV/Excel export.
- `src/app/api/*` — REST API routes (see table below).
- `src/lib/template.ts` — single source of truth for the Welcome Aboard HTML. Used by both the live preview (rendered in an iframe) and the actual outgoing email, so preview == email by construction.
- `src/components/AnnouncementForm.tsx` — the dynamic form + live preview + recipient picker + send action.
- `src/models/*` — Mongoose schemas: `User`, `Announcement`, `Recipient`, `EmailHistory`.

## REST API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Authenticate, sets session cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current session info |
| POST | `/api/auth/forgot-password` | Email a reset link |
| POST | `/api/auth/reset-password` | Consume reset token, set new password |
| GET/POST | `/api/announcements` | List (search/filter/paginate) / create draft |
| GET/PUT/DELETE | `/api/announcements/[id]` | Read / update draft / delete draft |
| POST | `/api/announcements/[id]/send` | Render template, email recipients, mark as sent, log to `EmailHistory` |
| POST | `/api/upload` | Validate + store profile image, returns `imageUrl` |
| GET/POST | `/api/recipients` | List/search recipients / import (CSV parsed client-side, upserted by email) |
| GET | `/api/users` | List/search/filter/sort/paginate users |
| GET | `/api/users/export` | Download CSV or XLSX (`?format=csv|xlsx`) |

## Validation rules

- All employee fields except bio are required (`src/lib/validation.ts`).
- Email format validated for login, official email, recipients.
- Mobile number validated against a simple international-friendly pattern.
- Birthday must be `YYYY-MM-DD`.
- Images limited to JPEG/PNG/WebP, 5MB max, checked both client-side and server-side.
- A sent announcement cannot reuse an official email that already has a non-draft announcement (duplicate-employee guard).
- Drafts can be edited/deleted; sent announcements are read-only and cannot be deleted.

## Template fidelity

The card has a `gender` field (male/female) driving `Mr./Ms.` and pronouns,
since the original template uses gendered language ("He/She will be based
in…") but the spec's field list didn't include it. Note the logo used here
(`public/logo.svg`) is a placeholder triangle mark — swap in the real MITRA
logo asset at that path to match the brand exactly.

## Deployment notes

- `npm run build && npm start` for production.
- Uploaded images are written to `public/uploads/`; back this with persistent storage/volume in production (or swap `src/app/api/upload/route.ts` for S3/object storage — the API contract, `{ imageUrl }`, stays the same).
- Set a strong, unique `JWT_SECRET` and serve over HTTPS so the session cookie's `secure` flag is meaningful.
- Gmail SMTP requires an "app password" (already supplied via `MAIL_PASS`); for higher volume sending, swap Nodemailer's transport for a dedicated provider (SES/SendGrid) without touching call sites in `src/lib/mail.ts`.
