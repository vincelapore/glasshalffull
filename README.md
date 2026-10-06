# Glass Half Full

A discovery hub and community directory for Brisbane’s creative scene — DJs, musicians, tattoo artists, visual art, fashion, and more.

Browse upcoming events, meet local creatives, and submit listings for moderation before they go live.

## Features

- **Events** — upcoming nights with category, location, tickets, and flyer images
- **Creatives** — artist profiles with craft category, bio, links, and work-opportunity tags
- **Accounts** — Neon Auth sign-up / sign-in; one editable creative profile per account
- **Event submissions** — from `/account` (pending until approved)
- **Admin moderation** — same login; owners manage the admin list, admins review submissions
- **Light/dark theme** — dark by default

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + React 19 |
| Language | TypeScript |
| Database | [Neon](https://neon.tech) serverless Postgres |
| Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (photos/flyers) + Neon text keys |
| ORM | [Drizzle](https://orm.drizzle.team) |
| UI | [Tailwind CSS](https://tailwindcss.com) 4 + [shadcn/ui](https://ui.shadcn.com) (Base UI) |
| Forms | React Hook Form + Zod |
| Mutations | Next.js Server Actions |

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (or any Postgres URL Neon’s serverless driver accepts)
- A Cloudflare R2 API token for the `glasshalffull` bucket (see Photo uploads below)

### Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# Neon Serverless Postgres
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Neon Auth — Auth URL from Console → Branch → Auth
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=   # openssl rand -base64 32

# Owners can add/remove admins (always includes vincemlapore@gmail.com)
OWNER_EMAILS=vincemlapore@gmail.com
# Optional extra admin emails (moderation only)
ADMIN_EMAILS=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=glasshalffull

# Public media origin — Neon stores object keys only, not full URLs
# Copy the Public Development URL from R2 → glasshalffull → Settings
NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

Register trusted Auth domains in Neon (scheme, no trailing slash), e.g. `http://localhost:3000` and `https://glasshalffull.space`.

Push the schema to your database:

```bash
npm run db:push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly to the database |
| `npm run db:studio` | Open Drizzle Studio |

## Project structure

```
src/
  app/           # App Router pages, layouts, and server actions
  components/    # UI, forms, admin, and media components
  db/            # Drizzle schema and Neon client
  lib/           # Queries, validation, labels, admin helpers
```

Notable routes:

- `/` — home (featured events + creatives)
- `/events`, `/events/[id]` — event listing and detail
- `/creatives`, `/creatives/[id]` — creative directory and profiles
- `/auth/sign-in`, `/auth/sign-up` — Neon Auth accounts
- `/account` — profile editor + your event submissions
- `/account/events/new` — submit an event
- `/admin/submissions` — moderation (owners and admins)
- `/admin/team` — add/remove admins (owners only)

## Deploy

Designed for [Vercel](https://vercel.com) with a Neon database:

1. Create a Neon project and copy the connection string
2. Deploy the repo to Vercel
3. Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `OWNER_EMAILS`, the `R2_*` secrets, and `NEXT_PUBLIC_MEDIA_BASE_URL` in the project environment. Add your production origin as a Neon Auth trusted domain.
4. Run `npm run db:push` against production (or apply migrations) once before going live

## Photo uploads

Photos and flyers never pass through Next.js. The browser compresses to WebP (720px avatars / 1080px flyers), then PUTs directly to R2 with a short-lived presigned URL. Neon stores only the object key (`avatars/{uuid}.webp` or `flyers/{uuid}.webp`). The public origin is `NEXT_PUBLIC_MEDIA_BASE_URL` so the CDN domain can change without rewriting rows.

Images are rendered with `next/image` `unoptimized` (also set globally in `next.config.ts`) so Vercel Image Optimization is never used.

### Cloudflare checklist

1. **R2 API token** — in the Cloudflare dashboard, create an S3-compatible API token for the `glasshalffull` bucket (`Object Read & Write`). Copy Account ID, Access Key ID, and Secret Access Key into env vars. MCP/bindings cannot mint this token.
2. **Public development URL** — in the bucket Settings, enable **Public Development URL** (`https://pub-….r2.dev`) and set that value as `NEXT_PUBLIC_MEDIA_BASE_URL`. This endpoint is rate-limited; a custom domain can replace it later without rewriting database rows.
3. **CORS** — browsers must PUT to the S3 API host. Apply:

```bash
npx wrangler r2 bucket cors set glasshalffull --file r2-cors.json
```

Add your production origin to `r2-cors.json` if it is not `https://glasshalffull.space` (Vercel preview URLs need to be listed explicitly). `Cache-Control` must be allowed because the signed PUT includes a one-year immutable cache header.

## License

Private project — all rights reserved.
