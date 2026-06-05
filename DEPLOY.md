# Deployment Runbook — DigitalOcean Droplet

Deploy the full stack (Caddy + Next.js + NestJS + Go stats + Postgres) to a
single DigitalOcean Droplet with automatic HTTPS. Copy-paste friendly.

> Architecture and components: see [`COMPONENTS.md`](./COMPONENTS.md).
> One public entrypoint (Caddy) routes `/` → frontend, `/api` → backend,
> `/stats-api` → Go service. Everything else is internal.

---

## 0. Prerequisites
- A DigitalOcean account (free credit is fine).
- A domain you control (you have one). We'll use `pomodoro.example.com` below —
  replace with your real subdomain everywhere.
- An SSH key added to your DigitalOcean account.

---

## 1. Create the Droplet
DigitalOcean → Create → Droplets:
- **Image:** Ubuntu 24.04 LTS
- **Size:** Basic / Regular — **2 GB RAM / 1 vCPU** ($12/mo) recommended.
  (1 GB works for *running* but Docker *builds* can OOM. See §9 for the 1 GB trick.)
- **Region:** closest to your users (e.g. Singapore).
- **Authentication:** your SSH key.
- Create, then note the Droplet's **public IP** (e.g. `203.0.113.10`).

## 2. Point your domain at the Droplet
In your domain registrar / DNS provider, add an **A record**:

```
Type: A    Host: pomodoro    Value: 203.0.113.10    TTL: 300
```

Verify (may take a few minutes to propagate):
```bash
dig +short pomodoro.example.com   # should print your Droplet IP
```
> Caddy needs DNS pointing here BEFORE it can issue a Let's Encrypt certificate.

## 3. SSH in and harden the firewall
```bash
ssh root@203.0.113.10

# Firewall: allow SSH + HTTP + HTTPS only
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
ufw status
```

## 4. Install Docker + Compose plugin
```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

## 5. Get the code
```bash
apt-get update && apt-get install -y git
git clone https://github.com/Marklu0509/pomodoro-app.git
cd pomodoro-app
```
> For now deploy from the branch you merged to (e.g. `main`). After PRs are
> merged: `git checkout main && git pull`.

## 6. Create the production env file
```bash
cp .env.prod.example .env.prod
nano .env.prod
```
Fill in **strong** values. Generate secrets with:
```bash
openssl rand -base64 32   # use for JWT_SECRET (and a strong POSTGRES_PASSWORD)
```
Required values:
```ini
POSTGRES_USER=pomodoro
POSTGRES_PASSWORD=<long-random>
POSTGRES_DB=pomodoro
JWT_SECRET=<long-random, >=16 chars, SAME secret used by backend + Go service>
JWT_EXPIRES_IN=1d
FRONTEND_ORIGIN=https://pomodoro.example.com
DOMAIN=pomodoro.example.com
```
> `.env.prod` is gitignored — it must never be committed.

## 7. Launch 🚀
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
First run builds all images and runs DB migrations automatically
(`prisma migrate deploy` happens on backend startup). Watch it come up:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f caddy
```

## 8. Verify
```bash
curl -I https://pomodoro.example.com/                  # 200, valid TLS
curl    https://pomodoro.example.com/stats-api/health  # {"status":"ok"}
```
Then open `https://pomodoro.example.com` in a browser and sign up.
Caddy obtains/renews the TLS certificate automatically — no manual certbot.

---

## 9. Operations

### Deploy an update
```bash
cd pomodoro-app
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Logs / restart / status
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod restart stats-service
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### Daily database backup (do this on day one)
Data is the one thing you can't rebuild. Add a cron job that dumps Postgres:
```bash
mkdir -p /root/backups
crontab -e
```
Add (daily at 03:00, keep 7 days):
```cron
0 3 * * * docker exec pomodoro-db pg_dump -U pomodoro pomodoro | gzip > /root/backups/pomodoro-$(date +\%F).sql.gz && find /root/backups -name '*.sql.gz' -mtime +7 -delete
```
Restore example:
```bash
gunzip -c /root/backups/pomodoro-2026-06-05.sql.gz | docker exec -i pomodoro-db psql -U pomodoro -d pomodoro
```
> Later (S2 in the scaling plan): move Postgres to DO Managed Database for
> automatic backups + failover. See COMPONENTS.md "擴充性備案".

### The 1 GB Droplet build trick
If you chose a 1 GB Droplet and `--build` gets OOM-killed, add swap once:
```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 10. Troubleshooting
| Symptom | Likely cause / fix |
|---------|--------------------|
| Caddy can't get a certificate | DNS A record not pointing at the Droplet yet, or port 80/443 blocked by firewall |
| `backend` restarts | Check `logs backend`; usually a missing/short `JWT_SECRET` or DB not ready |
| 502 from `/api` or `/stats-api` | That service is still starting or crashed — check its logs |
| Stats endpoints 500 | DB connection — ensure stats `DATABASE_URL` has **no** `?schema=public` |
| Build OOM on small Droplet | Add swap (§9) or build images in CI and pull them |
