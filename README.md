# Glass Half Full

A discovery hub and community directory for Brisbane’s creative scene — DJs, musicians, tattoo artists, visual art, fashion, and more.

Browse upcoming events, meet local creatives, and submit listings for moderation before they go live.

## Features

- **Events** — upcoming nights with category, location, tickets, and flyer images
- **Creatives** — artist profiles with craft category, bio, links, and work-opportunity tags
- **Public submissions** — `/submit/event` and `/submit/creative` (pending until approved)
- **Admin moderation** — password-protected `/admin` to approve, reject, edit, or delete submissions
- **Light/dark theme** — dark by default

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + React 19 |
| Language | TypeScript |
| Database | [Neon](https://neon.tech) serverless Postgres |
| ORM | [Drizzle](https://orm.drizzle.team) |
| UI | [Tailwind CSS](https://tailwindcss.com) 4 + [shadcn/ui](https://ui.shadcn.com) (Base UI) |
| Forms | React Hook Form + Zod |
| Mutations | Next.js Server Actions |

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (or any Postgres URL Neon’s serverless driver accepts)

### Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# Neon Serverless Postgres
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Admin moderation password for /admin
ADMIN_PASSWORD=change-me
```

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
- `/submit/event`, `/submit/creative` — public submission forms
- `/admin` — moderation dashboard (requires `ADMIN_PASSWORD`)

## Deploy

Designed for [Vercel](https://vercel.com) with a Neon database:

1. Create a Neon project and copy the connection string
2. Deploy the repo to Vercel
3. Set `DATABASE_URL` and `ADMIN_PASSWORD` in the project environment
4. Run `npm run db:push` against production (or apply migrations) once before going live

## License

Private project — all rights reserved.
