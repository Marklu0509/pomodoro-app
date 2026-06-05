# stats-service (Go)

A small, **read-only** analytics microservice for the Pomodoro app. It computes
the dashboard summary and the activity heatmap from the same PostgreSQL database
the NestJS backend writes to.

## Why a separate Go service?
- **Read-heavy aggregation** (a year of sessions) is what Go does well — fast,
  concurrent, and it compiles to a ~15 MB static image.
- **Separation of concerns**: NestJS owns auth/tasks/sessions and the schema;
  this service only reads. (Single-writer rule — it never writes or migrates.)
- Fixes the old NestJS stats issues: the **N+1 query** (7 queries in a loop) and
  the **server-timezone bug** — both solved with one timezone-aware `GROUP BY`.

## Auth
Stateless JWT (HS256). It verifies tokens issued by NestJS using the **same**
`JWT_SECRET`, so no shared session store is needed.

## Endpoints (mounted under `/stats-api`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats-api/health` | no | Liveness probe |
| GET | `/stats-api/summary?tz=Area/City` | yes | `{ today:{minutes,goal,progress}, weekly:[{date,minutes}] }` |
| GET | `/stats-api/heatmap?tz=Area/City` | yes | `[{ date:"YYYY-MM-DD", count }]` (count = minutes) |

`tz` is an IANA timezone (e.g. `Asia/Taipei`); defaults to UTC if missing/invalid.

## Layout
```
cmd/server        entrypoint + wiring
internal/auth     JWT middleware (golang-jwt)
internal/config   env loading + validation
internal/stats    repo (pgx) -> service (logic) -> handler (HTTP)
internal/httpx    JSON response helpers
```

## Run locally
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/pomodoro \
JWT_SECRET=<same-as-backend> PORT=4000 \
go run ./cmd/server

go test ./...      # unit tests (no DB required)
```

## Environment
| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `DATABASE_URL` | yes | — | PostgreSQL DSN (same DB as backend) |
| `JWT_SECRET` | yes | — | Must equal the backend's `JWT_SECRET` |
| `PORT` | no | `4000` | Listen port |
