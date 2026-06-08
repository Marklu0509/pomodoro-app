# Components — FocusFlow (multi-client Pomodoro app)

> What each **component** does: its responsibility, tech, inputs/outputs, key
> files, and how the pieces connect.
> For the roadmap and build history, see [`CAPSTONE_PLAN.md`](./CAPSTONE_PLAN.md).

---

## System overview

```
   User
     │ views UI, clicks
     ▼
┌─────────────┐   ┌─────────────┐
│ Web client  │   │ Chrome ext. │   ← two clients, one shared backend
│ (Next.js)   │   │ (WXT / MV3) │
└──────┬──────┘   └──────┬──────┘
       │  HTTPS requests (Bearer JWT) │
       └───────────┬────────────┘
                   ▼
            ┌─────────────┐
            │ Caddy        │   ← single entrypoint, path routing + auto HTTPS
            └──┬───────┬───┘
     /api/*    │       │   /stats-api/*
               ▼       ▼
   ┌──────────────┐  ┌──────────────┐
   │ NestJS API    │  │ Go stats svc  │
   │ auth/tasks/…  │  │ read-only     │
   │ (sole writer) │  │ (never writes)│
   └──────┬───────┘  └──────┬───────┘
          │   same database  │
          └────────┬─────────┘
                   ▼
            ┌─────────────┐
            │ PostgreSQL   │   ← durable storage
            └─────────────┘

   Every component runs as a Docker container, orchestrated by
   docker-compose.prod.yml on a single AWS EC2 instance.
```

### Golden rules (keep the architecture clean)
1. **Single writer** — only NestJS writes to the DB and owns the schema; the Go
   service is **read-only and never writes or runs migrations**.
2. **Same origin** — all clients call `/api` and `/stats-api` on one domain,
   routed by Caddy → no CORS / mixed-content issues.
3. **Stateless auth** — NestJS and Go share one `JWT_SECRET` and verify tokens
   independently; no shared session store.

---

## 1. Web client — Frontend (Next.js)

| | |
|------|------|
| **Responsibility** | Render the UI; collect input, call the backend, draw results. |
| **Tech** | Next.js (App Router) + React + TypeScript + Tailwind. |
| **Does NOT** | Encrypt, authorize, or touch the DB directly — all important logic is server-side. |
| **Key files** | `frontend/app/page.tsx` (login/signup), `app/(app)/focus` (workspace), `app/(app)/stats`, `app/components/Timer.tsx`, `HeatmapSection.tsx`, `frontend/utils/api.ts` (axios clients). |
| **Input / Output** | User clicks & forms → HTTP requests; responses rendered to the screen. |
| **Connects via** | axios instances calling `/api/*` (auth/tasks) and `/stats-api/*` (analytics); the JWT from `localStorage` is attached to every request. |

## 2. Browser extension — Extension (WXT / MV3)

| | |
|------|------|
| **Responsibility** | A persistent in-browser Pomodoro experience that does what the web can't. |
| **Tech** | WXT + React + TypeScript, Manifest V3. |
| **Unique abilities** | (1) background timer (2) toolbar countdown badge (3) site blocking during focus (4) desktop notifications. |
| **Parts** | **Popup** (UI), **Service worker** (background timer/logic), **Options page** (durations + block list). |
| **Timer design** | `chrome.alarms` + an **end-timestamp** in `chrome.storage`; remaining = `endsAt − now`. Never `setInterval` accumulation (the MV3 service worker sleeps). |
| **Blocking** | `declarativeNetRequest` dynamic rules redirect blocked sites during focus; removed on breaks/stop. |
| **Auth** | popup login → `/api/auth/login`; token stored in `chrome.storage.local`. |
| **Connects via** | the **same** backend `/api` + `/stats-api`; posts completed sessions to `/api/sessions` (queued offline, retried when back online). |

> The backend CORS allowlist includes `chrome-extension://` origins.

## 3. Backend API — NestJS

| | |
|------|------|
| **Responsibility** | Core logic and the **sole writer**: auth, tasks, sessions, settings, focus modes. |
| **Tech** | NestJS + TypeScript + Prisma (ORM) + Passport-JWT + bcrypt. |
| **Layers** | **Controller** (receive) → **Service** (logic) → **Prisma** (DB); **DTO** validates input; **Guard** protects routes; **Module** wires it together. |
| **Key files** | `backend/src/main.ts` (bootstrap/CORS/global prefix), `auth/`, `tasks/`, `sessions/`, `settings/`, `focus-modes/`, `prisma/`. |
| **Input / Output** | JWT-bearing HTTP requests + JSON body (DTO-validated) → JSON responses + DB reads/writes. |
| **Representative logic** | Signup: bcrypt-hash password → insert `users` → sign JWT. Create session: a `$transaction` that writes the record and updates task progress. |
| **Routing** | `setGlobalPrefix('api')`, so public paths are `/api/auth/...`, `/api/tasks/...`. |
| **Connects via** | Caddy forwards `/api/*`; reads/writes PostgreSQL; its JWTs are verified by both itself and the Go service. |

## 4. Stats service — Go

| | |
|------|------|
| **Responsibility** | Read-heavy analytics: today's minutes, last 7 days, one-year heatmap. |
| **Tech** | Go + `chi` + `pgx` (Postgres driver) + `golang-jwt`. |
| **Why separate** | (1) aggregation is read-heavy — Go is fast & light (2) separation of concerns (3) demonstrates a polyglot microservice. |
| **Hard constraint** | **Read-only**: `SELECT` only, never writes, never migrates (single-writer rule). |
| **Key design** | One timezone-aware `GROUP BY` (replaces the old NestJS N+1); takes a client timezone param to bucket days correctly. |
| **Endpoints** | `GET /stats-api/summary`, `/stats-api/heatmap` (+ `/health`). |
| **Input / Output** | JWT-bearing request (verifies HS256 with the shared `JWT_SECRET`, extracts userId) → JSON matching the frontend's expected shape. |
| **Connects via** | Caddy forwards `/stats-api/*`; read-only on the same PostgreSQL; verifies NestJS-issued JWTs. |

## 5. Database — PostgreSQL (+ Prisma)

| | |
|------|------|
| **Responsibility** | Durable storage; survives restarts. |
| **Tech** | PostgreSQL (relational); Prisma as NestJS's ORM (TS ↔ SQL + types). |
| **Main tables** | `users`, `settings`, `focus_modes`, `tasks`, `pomodoro_sessions` (see `backend/prisma/schema.prisma`). |
| **Relations** | Foreign keys, e.g. `tasks.user_id` → `users.id`. |
| **Schema source of truth** | Prisma migrations (`backend/prisma/migrations/`); prod uses `prisma migrate deploy`. |
| **Connects via** | NestJS read/write via Prisma; Go read-only via pgx; data persisted in a Docker named volume. |

## 6. Reverse proxy — Caddy

| | |
|------|------|
| **Responsibility** | The single public entrypoint; routes by path; terminates TLS (HTTPS). |
| **Tech** | Caddy (automatic HTTPS via Let's Encrypt). |
| **Routing** | `/` → frontend, `/api/*` → NestJS, `/stats-api/*` → Go. |
| **Why needed** | (1) one public domain → removes CORS / mixed-content (2) unified HTTPS (3) hides internal topology. |
| **Key file** | `caddy/Caddyfile`. |
| **Input / Output** | external HTTPS request → internal container → response back to the user. |

## 7. Containerization — Docker / Docker Compose

| | |
|------|------|
| **Responsibility** | Package each service with its environment into reproducible containers; start the whole stack with one command. |
| **Tech** | Docker (per-service Dockerfile) + Docker Compose. |
| **Containers** | `db` (Postgres) + `backend` (NestJS) + `stats-service` (Go) + `frontend` (Next.js) + `caddy`. |
| **Key files** | `docker-compose.prod.yml`, each service `Dockerfile`, `.env.prod` (gitignored). |
| **Why needed** | Solves "works on my machine"; deploy/update is `docker compose up -d --build` (or pull prebuilt images in CI/CD). |
| **Connects via** | Compose creates an internal network; only Caddy's 80/443 are exposed. |

---

## Cross-cutting — Authentication (JWT)

> The mechanism that glues the two clients and two services together.

- **Flow**: user logs in → NestJS signs a JWT with `JWT_SECRET` (contains userId + expiry + signature).
- **Carried**: every request sends it as `Authorization: Bearer <token>`.
- **Verified**: NestJS and Go each recompute the signature with the same `JWT_SECRET` and compare — no shared session lookup.
- **Why stateless**: any backend instance can verify any token → naturally supports multiple backends / horizontal scaling.
- **Security note**: the JWT payload is encoded, **not encrypted** (anyone can read it) → never put secrets in it; security comes from the tamper-proof signature. Short expiry (currently 1 day).

## End-to-end request example (viewing the heatmap)

```
1. User opens the Stats page
2. Frontend sends GET /stats-api/heatmap (with JWT)
3. Caddy sees /stats-api → forwards to the Go service
4. Go verifies the token with the shared JWT_SECRET → extracts userId
5. Go runs one GROUP BY query (minutes aggregated per day)
6. Go returns JSON: [{date, count}, ...]
7. Frontend HeatmapSection renders the cells
```
**Input = one query; output = a rendered activity heatmap.**

## Scaling roadmap (how each component evolves with load)

| Stage | Trigger | Action | Affected |
|-------|---------|--------|----------|
| S0 now | 0–hundreds | one instance runs all containers | all |
| S1 vertical | hundreds–thousands | resize the instance (one click) | no code change |
| S2 split DB | thousands+ | move Postgres to a managed DB (auto backups) | DB |
| S3 horizontal | tens of thousands+ | add a load balancer, run multiple backend instances (small change since stateless) | proxy/backend |
| future | many consumers / high throughput | event-driven: NestJS emits `session.completed`, Go subscribes to precompute stats (Kafka/RabbitMQ) | backend/Go |

> Stay at **S0** until it hurts; being able to explain the S0→S3 path is itself
> a strong talking point. Minimum data safety today: a daily `pg_dump` cron
> (`scripts/db-backup.sh`); at S2 the managed DB handles backups automatically.
