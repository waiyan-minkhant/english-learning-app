# English Learning App Monorepo

Turborepo workspace with:

- `apps/docs` - Next.js docs site
- `apps/frontend` - Next.js app with TypeScript, Tailwind, shadcn/ui baseline, and Zustand
- `apps/api` - Express.js API with TypeScript, Prisma, and Postgres via Docker

## Getting started

1. Install dependencies:

```bash
pnpm install
```

2. Start Postgres:

```bash
cd apps/api && docker compose up -d
```

3. Copy env:

```bash
cp apps/api/.env.example apps/api/.env
```

4. Generate Prisma client:

```bash
pnpm --filter api prisma:generate
```

5. Run all apps:

```bash
pnpm dev
```
