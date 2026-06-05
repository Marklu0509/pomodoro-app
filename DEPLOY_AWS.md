# Deployment Runbook — AWS EC2 (Free Tier)

Deploy the full stack to a single EC2 instance with automatic HTTPS. Same Docker
setup as [`DEPLOY.md`](./DEPLOY.md); this doc covers the AWS-specific parts.

> **AWS concepts you'll meet:**
> - **AMI** = the OS image (we use Ubuntu).
> - **EC2 instance** = the virtual machine.
> - **Security Group** = AWS's firewall (which ports are open).
> - **Key Pair** = the SSH key used to log in (`.pem` file).
> - **Elastic IP** = a *static* public IP so your domain keeps pointing correctly
>   even after a reboot.

⚠️ **1 GB RAM:** the free-tier instance is small. We add **swap** (step 6) so
Docker builds don't get killed.

---

## 1. Launch an EC2 instance
AWS Console → **EC2** → **Launch instance**:
- **Name:** `pomodoro`
- **AMI:** Ubuntu Server 24.04 LTS (64-bit x86)
- **Instance type:** `t3.micro` or `t2.micro` — whichever shows **"Free tier eligible"**
- **Key pair:** Create new → name it `pomodoro-key` → download `pomodoro-key.pem` (keep it safe)
- **Network settings → Firewall (security group):** Create new, allow:
  | Type | Port | Source |
  |------|------|--------|
  | SSH | 22 | My IP |
  | HTTP | 80 | Anywhere (0.0.0.0/0) |
  | HTTPS | 443 | Anywhere (0.0.0.0/0) |
- **Storage:** 30 GiB gp3 (free tier allows up to 30 GiB)
- **Launch instance**

## 2. Give it a static IP (Elastic IP)
EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate.
Then **Actions → Associate** → choose your `pomodoro` instance.
Note this **Elastic IP** (e.g. `3.25.x.x`) — this is your server's permanent IP.

> Keep the Elastic IP *associated with a running instance*; AWS only charges for
> idle/unassociated Elastic IPs.

## 3. Point your domain at the Elastic IP
In your domain's DNS settings, add an **A record** (no new domain purchase needed):
```
Type: A   Host: pomodoro   Value: <your Elastic IP>   TTL: 300
```
Verify (wait a few minutes):
```bash
dig +short pomodoro.yourdomain.com   # should print the Elastic IP
```

## 4. SSH into the instance
On your Mac, from the folder with the `.pem` file:
```bash
chmod 400 pomodoro-key.pem
ssh -i pomodoro-key.pem ubuntu@<your Elastic IP>
```
> The login user for Ubuntu AMIs is **`ubuntu`** (not `root`). Use `sudo` for admin commands.

## 5. (Firewall) — already handled by the Security Group
Unlike the DO runbook, you do **not** run `ufw`; the Security Group from step 1
is your firewall. (You may also enable `ufw` if you want defense in depth.)

## 6. Add swap (important on 1 GB RAM)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # should now show 2.0Gi swap
```

## 7. Install Docker + Compose
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu      # run docker without sudo
newgrp docker                       # apply group now (or log out/in)
docker --version && docker compose version
```

## 8. Get the code
```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/Marklu0509/pomodoro-app.git
cd pomodoro-app
# deploy from your merged branch (e.g. main) once PRs are merged
```

## 9. Create the production env file
```bash
cp .env.prod.example .env.prod
nano .env.prod
```
Generate secrets — **use hex for the DB password** (URL-safe), base64 is fine for JWT:
```bash
openssl rand -hex 32      # POSTGRES_PASSWORD (avoids /+: that break DATABASE_URL)
openssl rand -base64 32   # JWT_SECRET
```
Fill:
```ini
POSTGRES_USER=pomodoro
POSTGRES_PASSWORD=<long-random>
POSTGRES_DB=pomodoro
JWT_SECRET=<long-random, >=16 chars>
JWT_EXPIRES_IN=1d
FRONTEND_ORIGIN=https://pomodoro.yourdomain.com
DOMAIN=pomodoro.yourdomain.com
```

## 10. Launch 🚀
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
First run builds images (slow on 1 GB — swap makes it survive) and runs DB
migrations automatically. Watch:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f caddy
```

## 11. Verify
```bash
curl -I https://pomodoro.yourdomain.com/
curl    https://pomodoro.yourdomain.com/stats-api/health   # {"status":"ok"}
```
Open the site, sign up, run a pomodoro, check stats.

---

## Operations
Same as [`DEPLOY.md`](./DEPLOY.md) §9–10: update flow (`git pull` + `up -d --build`),
logs/restart, **daily `pg_dump` backup cron**, and the troubleshooting table.

### AWS-specific gotchas
| Symptom | Fix |
|---------|-----|
| Build killed / hangs | swap not enabled — redo step 6 |
| Can't SSH | Security Group SSH source isn't your current IP; update it, or `.pem` perms (`chmod 400`) |
| Caddy can't get cert | A record not pointing at the Elastic IP yet, or 80/443 not open in the Security Group |
| Site unreachable after reboot | you used the instance's auto IP, not the Elastic IP — re-check the A record |
