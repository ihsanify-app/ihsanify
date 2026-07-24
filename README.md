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
DATABASE_URL=
JWT_SECRET=
```

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
