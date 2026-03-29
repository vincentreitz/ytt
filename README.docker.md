# Docker Development Guide

This repository includes a dev-focused Docker setup for running the app locally with hot-reload.

## What gets started

`docker-compose.dev.yml` runs:

- `frontend` (`@workspace/yttracker`) on `http://localhost:5173`
- `api` (`@workspace/api-server`) on `http://localhost:3000`
- `db` (Postgres 16) on `localhost:5432`

## Prerequisites

- Docker + Docker Compose
- `pnpm` (only needed if you use the package scripts below)

## Quick start

From the repo root (`ytt/`):

1. Build images: `pnpm docker:dev:build`
2. Start stack: `pnpm docker:dev:up`
3. Open app: `http://localhost:5173`

To stop:

- `pnpm docker:dev:down`

To tail logs:

- `pnpm docker:dev:logs`

## Direct Compose commands (equivalent)

- Start (with build): `docker compose -f docker-compose.dev.yml up --build`
- Stop: `docker compose -f docker-compose.dev.yml down`
- Logs: `docker compose -f docker-compose.dev.yml logs -f`

## Environment notes

Default dev values are embedded in `docker-compose.dev.yml`:

- API:
  - `PORT=3000`
  - `DATABASE_URL=postgresql://postgres:postgres@db:5432/yttracker`
  - `SESSION_SECRET=dev-secret-change-me`
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (empty by default)
- Frontend:
  - `PORT=5173`
  - `BASE_PATH=/`

If you need Google OAuth locally, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the compose file (or override with your own env strategy).

## Database schema push (dev)

After the stack is running, push schema to Postgres:

`docker compose -f docker-compose.dev.yml exec api pnpm --filter @workspace/db push`

## Useful cleanup

Remove containers, network, and volumes (including Postgres data):

`docker compose -f docker-compose.dev.yml down -v`
