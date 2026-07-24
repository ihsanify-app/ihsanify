# lms-project-v1
A repository that contains my LMS Project v1.0

## Getting Started

This is a pnpm monorepo (`pnpm@10.28.0`). Install dependencies once from the repo root:

```bash
pnpm install
```

### Environment

Create a `.env` file at the repo root (all apps load it via `dotenv -e ../../.env`) with:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5440/postgres
JWT_SECRET=
```

`DATABASE_URL` above matches the Docker Compose setup in the next section — change it only if you're pointing at a different Postgres instance.

### Database (Docker)

The API needs Postgres running. `docker-compose.dev.yml` at the repo root spins one up on port `5440`:

```bash
docker compose -f docker-compose.dev.yml up -d   # start Postgres in the background
docker compose -f docker-compose.dev.yml ps      # check it's running
```

Then apply the schema (from `apps/api`):

```bash
cd apps/api
pnpm with-env prisma migrate deploy
```

There's no seed script yet, so a fresh database has no users — register one via `POST /register` on the API before trying to log in through the web app.

### Running

```bash
pnpm platform:dev   # student/teacher/admin web app → http://localhost:3000
pnpm api:dev        # HonoJS backend
pnpm admin:dev      # admin app → http://localhost:4000
pnpm ui:dev         # shared UI package, watches Tailwind build
pnpm dev            # runs platform + api + admin + ui in parallel
```

If you're only working on the frontend against mock data, `pnpm platform:dev` alone is enough — the API isn't wired up yet (see `PLAN.md`).

### Other scripts

```bash
pnpm lint           # biome check
pnpm lint:fix       # biome check --write
```
