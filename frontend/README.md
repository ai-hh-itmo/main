# Talentmine Frontend

Modern Next.js interface for the Talentmine recommendation backend.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS v4 with CSS-first theme tokens
- TanStack Query for request state
- React Hook Form + Zod for validation
- Motion for subtle transitions

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`BACKEND_URL` points the Next.js route handlers to the Go backend:

```bash
BACKEND_URL=http://localhost:8080
```

The browser calls local Next.js routes:

- `GET /api/health`
- `POST /api/recommendations`

Those routes proxy to the backend, so the Go service does not need CORS changes for local frontend development.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Docker

From the monorepo root:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:3000` and proxies API calls to the
backend container at `http://backend:8080`.
