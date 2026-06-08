# Project Plan & Engineering Log — FocusFlow

> How this project was taken from a single web app to a deployed, multi-client
> product with a polyglot backend and CI/CD. Component details live in
> [`COMPONENTS.md`](./COMPONENTS.md); deployment in
> [`DEPLOY_AWS.md`](./DEPLOY_AWS.md); the pipeline in [`CICD.md`](./CICD.md).

**Status:** ✅ Live at https://pomodoro.marklu.page (AWS EC2, auto-deployed on every push to `main`).

---

## Target architecture

```
 Web (Next.js)  +  Chrome extension (WXT/MV3)
        │  HTTPS (Bearer JWT)
        ▼
     Caddy  ──┬── /            → frontend (Next.js)
              ├── /api/*        → backend (NestJS) — auth/tasks, sole writer
              └── /stats-api/*  → stats-service (Go) — read-only analytics
                       │ both read the same Postgres
                       ▼
                  PostgreSQL
   All containerized (Docker Compose) on one EC2 instance.
```

**Design rules:** single writer (NestJS owns the schema, Go is read-only) ·
same-origin routing via Caddy (no CORS) · stateless JWT (HS256) shared by both
services.

---

## What was built (all phases complete)

**Phase 0 — Hardening.** Fixed demo-breaking bugs: axios timeout + error
handling; optional `name` on signup; moved the hardcoded JWT secret to env with
startup validation (`@nestjs/config`); CORS allowlist (incl. `chrome-extension://`);
rate-limited auth (`@nestjs/throttler`). Repaired the broken test suite.

**Phase 1 — Go analytics microservice (`stats-service/`).** chi + pgx +
golang-jwt, layered (handler → service → repo). Verifies NestJS-issued HS256
tokens with the shared secret. Replaces the old N+1 stats queries with a single
timezone-aware `GROUP BY`, fixing both performance and a server-timezone bug.
Table-driven tests; ~20 MB distroless image.

**Phase 2/3 — Containerization + reverse proxy.** Multi-stage Dockerfiles for
all services; `docker-compose.prod.yml` (db + backend + stats + frontend +
caddy) with healthchecks and named volumes; Caddy as a single-origin reverse
proxy with automatic HTTPS. Verified the full stack end-to-end locally.

**Phase 4 — Deployment (AWS EC2).** Ubuntu instance + swap, Docker, Elastic IP,
DNS, security group; Let's Encrypt HTTPS via Caddy. Runbooks:
[`DEPLOY_AWS.md`](./DEPLOY_AWS.md) / [`DEPLOY.md`](./DEPLOY.md).

**Phase 5 — README + CI.** Honest README with diagrams; GitHub Actions CI for
TypeScript (jest, tsc, build) and Go (vet, test, build).

**Extras — Frontend refactor + CI/CD.** Unified the messy IA into one `(app)`
route group (shared layout, merged focus workspace, shared types/data). Added
continuous deployment: push to `main` → build images on the runner → push to
GHCR → SSH-deploy to EC2 (the 1 GB instance only pulls). See [`CICD.md`](./CICD.md).

**Phase 6 — Chrome extension (`extension/`).** WXT + MV3: background timer
(`chrome.alarms` + end-timestamp), toolbar badge, desktop notifications, popup
login sharing the backend, **focus-mode site blocking** (`declarativeNetRequest`),
an options page (custom durations + block list), and offline-tolerant session
sync.

**Phase 7 — Logic polish.** Real session timestamps (`endTime = now`,
`startTime = now − duration`) + optional `COMPLETED`/`ABANDONED` status;
task completion kept in sync both ways. Backup script (`scripts/db-backup.sh`)
and Chrome Web Store assets (`extension/PRIVACY.md`, `STORE_LISTING.md`).

---

## Notable problems solved (worth discussing)

- **Live signup hung** — the web client fell back to `http://localhost:3000`
  with no axios timeout. Fixed with same-origin `/api` + a timeout.
- **Prisma on Alpine** — needed `openssl` and the `linux-musl-openssl-3.0.x`
  binary target; the entrypoint is `dist/src/main`.
- **pgx vs Prisma DSN** — the Go service's `DATABASE_URL` must omit
  `?schema=public` (a Prisma-only param pgx rejects).
- **URL-unsafe DB password** — base64 secrets can contain `/ + :` and break the
  connection string; use `openssl rand -hex 32`.
- **AWS Elastic IP** — allocating ≠ associating; DNS must point at the
  associated EIP. Security group must allow 22 from the CI runner for SSH deploy.

---

## Possible future work
- Sync the extension's durations with the user's server-side focus modes.
- Event-driven analytics (Kafka/RabbitMQ) at higher scale (see COMPONENTS.md).
- Managed Postgres + automated backups (scaling stage S2).
