# CI/CD — auto-deploy to EC2 on push to `main`

Pipeline (in `.github/workflows/ci.yml`):

```
push main
  ├─ test:   backend (jest) · frontend (tsc+build) · stats (go test)   [also on PRs]
  ├─ publish: build 3 images on the GitHub runner → push to GHCR        [main only]
  └─ deploy:  SSH into EC2 → docker compose pull + up -d                 [main only]
```

The heavy `docker build` runs on GitHub's runners (not the 1 GB EC2). The EC2
only **pulls** prebuilt images from GitHub Container Registry (GHCR) → fast,
no OOM, no swap thrash.

Images published:
- `ghcr.io/marklu0509/pomodoro-backend:latest`
- `ghcr.io/marklu0509/pomodoro-frontend:latest`
- `ghcr.io/marklu0509/pomodoro-stats:latest`

---

## One-time setup

### 1. Add GitHub repository secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | your Elastic IP, e.g. `18.204.223.118` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | the **full contents** of `pomodoro-key.pem` (incl. the BEGIN/END lines) |

> `GITHUB_TOKEN` is provided automatically — no secret needed for GHCR.

### 2. Make sure the EC2 git checkout is clean & on main
On the server (one time):
```bash
cd ~/pomodoro-app
git checkout main
git pull
```
The deploy step runs `git pull --ff-only`, so the working tree must be clean
(`.env.prod` is gitignored, so it won't block pulls).

### 3. First run
Merge to `main` (or push). Watch **Actions** tab: `test → publish → deploy`.
The first `publish` creates the GHCR packages (private by default).

> If `deploy` fails to pull with a permissions error, either:
> - keep it private — the deploy logs into GHCR with `GITHUB_TOKEN` (already wired), or
> - make the 3 packages **Public**: GitHub profile → Packages → each package →
>   Package settings → Change visibility → Public (then EC2 needs no login).

---

## Daily use
Just push to `main` (or merge a PR). The site redeploys automatically.
No more manual `git pull` / `docker compose up` on the server.

## Rollback
Images are tagged `:latest`. To roll back, re-run an older successful workflow,
or on the EC2 pull a previous image SHA manually. (A future improvement: tag
images with the commit SHA for precise rollbacks.)

## Security notes
- The SSH private key lives only in GitHub Secrets (encrypted), never in git.
- Images contain no secrets; runtime secrets stay in `.env.prod` on the server.
- EC2 Security Group only needs 22/80/443 open (22 ideally from your IP only;
  GitHub-hosted runners use changing IPs, so 22 must allow the runner — see note).

> ⚠️ The deploy connects over SSH (port 22) from a GitHub-hosted runner whose IP
> changes. If your Security Group restricts 22 to "My IP", the deploy will time
> out. Options: allow 22 from anywhere (key-only auth still protects you), use a
> self-hosted runner, or AWS SSM. Simplest for now: allow 22 from `0.0.0.0/0`
> (keep password auth disabled — key only).
