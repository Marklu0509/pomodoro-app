# Capstone Plan — Pomodoro 多端產品（網頁 + 擴充）+ Go 微服務 + DigitalOcean 部署

> **目的**：把 Pomodoro 打磨成作品集等級的**多端產品** —— 網頁 + Chrome 擴充共用後端，後端為 NestJS(TS) + 一個 Go 分析微服務的 polyglot 架構，部署到 DigitalOcean Droplet（Docker Compose + Nginx），並讓 README 與實際架構一致。
> **這份檔案是工作的單一事實來源（source of truth）**。每完成一項就更新 checkbox、Phase 狀態與「進度日誌」。

- **建立日期**：2026-06-03
- **最後更新**：2026-06-05
- **部署平台（已選定）**：DigitalOcean Droplet + Docker Compose + Nginx
- **擴充方案（已選定）**：方案 B — 背景優先 MV3 擴充（WXT + React/TS）
- **語言策略（已選定）**：TS 為底盤；新增一個聚焦的 **Go 微服務**（stats 分析），非整個後端重寫
- **整體狀態**：🟢 Phase 0–3 + 5 完成、Phase 4 runbook 已備（待使用者上線）；里程碑 M1（網頁版可上線）達成、M2（README/CI）達成。下一步：使用者照 DEPLOY.md 上線，或進 Phase 6（擴充）
- **組件功能說明**：見 [`COMPONENTS.md`](./COMPONENTS.md)

---

## 待決策（開工前需確認）

| # | 決策 | 選項 | 狀態 |
|---|------|------|------|
| D1 | 範圍 / 順序 | 全做 / 先把網頁上線(P0–P5)再做擴充(P6) | ⬜ 未定（建議：先上線再擴充） |
| D2 | 網域 | 自有網域 / 買新網域 / 先用 `nip.io` | ✅ 已定：使用者**有自有網域** |
| D3 | TLS 方案 | Nginx + Certbot / Caddy 自動 HTTPS | ⬜ 未定（建議：Caddy 自動 HTTPS，新手最省事） |
| D4 | Go 服務範圍 | 只接管 stats（建議）/ 連 sessions 攝取也接管 | ⬜ 未定（建議：只 stats） |

---

## 目標架構

```
                ┌──────────── DigitalOcean Droplet ($4-6/mo) ────────────┐
 Browser ──────▶│  Nginx (80/443, TLS)                                   │
 / Extension    │   ├ /            → frontend container (Next.js)         │
                │   ├ /api/*        → backend container (NestJS) 認證/任務  │
                │   └ /stats-api/*  → stats-service container (Go) 分析 ★   │
                │         backend 與 Go 共讀同一個 Postgres container       │
                └────────────────────────────────────────────────────────┘
   兩個前端共用後端：① 網頁(Next.js)   ② Chrome 擴充(MV3 / WXT)
   NestJS 與 Go 用同一組 JWT_SECRET 驗 HS256 token（polyglot 服務間認證）
   前端/擴充打同源 /api 與 /stats-api → 無 CORS / mixed-content 問題
```

**關鍵設計**
- 後端加 `app.setGlobalPrefix('api')`；前端/擴充打**同源** `/api`、`/stats-api`，Nginx 依路徑分流。
- Go 微服務只負責**讀取繁重的分析**（heatmap / weekly / streak），用單次 `GROUP BY` + 接收 client timezone，一次解決舊的 N+1 與時區 bug。
- 計時器（擴充）用 `chrome.alarms` + 「結束時間戳回推」，不可用 setInterval 累加。

**黃金規則（保持架構乾淨；2026-06-04 架構審查確認）**
1. **單一寫入者**：只有 NestJS 寫 DB 並擁有 schema；**Go 服務唯讀，絕不寫、絕不跑 migration**（避免共用 DB 的耦合問題，形成乾淨的 read-only analytics sidecar）。
2. **同源**：所有前端打同網域 `/api`、`/stats-api`，消除 CORS / mixed-content。
3. **無狀態認證**：NestJS 與 Go 共用同一把 `JWT_SECRET`、同一演算法(HS256)，各自獨立驗證。

---

## Phase 0 — 修正會讓 Demo 壞掉的 Bug（可獨立先做）

> 狀態：✅ 完成（2026-06-05，分支 `feat/phase0-hardening`；後端 build 綠、jest 18/18 綠、前端 tsc 綠）

- [x] **0.1** axios 加 `timeout`(10s) + `getApiErrorMessage` 錯誤正規化 — `frontend/utils/api.ts`；並接進 `app/page.tsx`（timeout/網路/伺服器訊息分流，不再無限轉圈、不再誤導）。baseURL 預設改同源 `/api`
- [x] **0.2** 修 signup `name` 不一致 — `create-auth.dto.ts` 改 `@IsOptional()`；加 `create-auth.dto.spec.ts`
- [x] **0.3** JWT secret 移到環境變數 — 新增 `config/env.validation.ts`(啟動驗證) + `ConfigModule.forRoot`；`JwtModule.registerAsync` 讀 `JWT_SECRET`；`auth.service.ts`/`jwt.strategy.ts` 移除硬編碼；加 `auth.service.spec.ts`
- [x] **0.4** CORS 改 env 白名單 — `main.ts` 用 `FRONTEND_ORIGIN`(逗號分隔) + 允許 `chrome-extension://`
- [x] **0.5** auth 端點加 `@nestjs/throttler` 速率限制（5 次/分）+ 全域 60/分
- [x] **附帶**：修好 6 個壞掉的 stub 測試（stats/settings/focus-modes 缺 PrismaService mock、focus-modes.controller.spec 內容錯置）→ 測試套件回到全綠
- [x] **附帶**：提前完成 P2.3 後端部分 `app.setGlobalPrefix('api')`；新增 `backend/.env.example`

## Phase 1 — Go 分析微服務（新增；引入 Go + 修掉舊 stats 問題）

> 狀態：✅ 完成（2026-06-05；`go vet`/`go build`/`go test` 全綠、health+401 冒煙測試通過、前端 tsc 綠）　|　目錄：`stats-service/`

- [x] **1.1** Go module（`go 1.23`）+ chi router，分層 `cmd/server` + `internal/{auth,config,stats,httpx}`
- [x] **1.2** JWT 中介層（`golang-jwt/v5`）：共用 `JWT_SECRET` 驗 HS256，含「只接受 HMAC」安全檢查、`sub`→userId 入 context；4 情境測試
- [x] **1.3** `pgx/v5` repo：單次 `GROUP BY` + `AT TIME ZONE` 依 client tz 分日（修掉 N+1 + 時區 bug）；`PgRepository` 唯讀
- [x] **1.4** 端點 `GET /stats-api/summary`、`/stats-api/heatmap`（+ `/health`）。**weekly 併入 summary 回傳**以對齊前端單一呼叫的契約
- [x] **1.5** 表格驅動測試（service 用 fake repo，免 DB）：summary/gap-fill/progress clamp/heatmap 排序 + auth 4 案
- [x] **1.6** `stats-service/Dockerfile`：多階段 → `distroless/static`，`time/tzdata` 內嵌（image build 待 Phase 2 docker daemon）
- [x] **1.7** 前端新增 `statsApi` 實例打 `/stats-api` + 帶 `tz`（`getClientTimezone`）；改 `app/stats` 與 `HeatmapSection`。NestJS `stats` 模組保留為 fallback（現已無人呼叫）
  - 驗收：✅ `go test ./...` 綠、JWT 驗證通過、契約對齊前端、前端 tsc 綠

## Phase 2 — 真正容器化（補上 README 宣稱卻不存在的檔案）

> 狀態：✅ 完成（2026-06-05；本機實際 build + up + 端到端冒煙測試全通過）

- [x] **2.1** `backend/Dockerfile`（多階段；`prisma migrate deploy` → `node dist/src/main`）。踩雷修正：Alpine 需 `openssl` + schema `binaryTargets` 加 `linux-musl-openssl-3.0.x`；進入點是 `dist/src/main`
- [x] **2.2** `frontend/Dockerfile`（Next.js standalone；`next.config.ts` 加 `output:'standalone'`）→ 374MB
- [x] **2.3** 後端 `setGlobalPrefix('api')`（P0 已做）；前端同源 `/api`、`/stats-api` 預設（P1 已做）
- [x] **2.4** `docker-compose.prod.yml`：`db`+`backend`+`stats-service`+`frontend`+`caddy`，healthcheck/depends_on(service_healthy)/named volume；只對外開 Caddy。踩雷修正：stats-service 的 DATABASE_URL **不可帶 `?schema=public`**（pgx 不認）
- [x] **2.5** `.env.prod.example`（POSTGRES_*、JWT_SECRET、FRONTEND_ORIGIN、DOMAIN；DATABASE_URL 由 compose 組）
- [x] **2.6** `.gitignore` 補 `.env.prod`（已驗證 ignored）
  - 驗收：✅ 五服務全起；image 大小 stats=20MB / frontend=374MB / backend=697MB；端到端：signup→login→建 session(NestJS 寫)→Go summary 讀到 25min/progress21（跨服務 JWT + 共用 DB 驗證成功）

## Phase 3 — Caddy 反向代理 + HTTPS

> 狀態：🟡 大致完成（隨 Phase 2 一起做）；正式 TLS 待 Phase 4 在 Droplet 上用真網域驗證

- [x] **3.1** `caddy/Caddyfile`：`/api/*`→backend、`/stats-api/*`→Go、其餘→frontend（用 `handle` 保留路徑）+ security headers + gzip
- [x] **3.2** TLS：採 Caddy 自動 HTTPS（`{$DOMAIN}` 真網域時自動申請 Let's Encrypt；本機用 `:80` 純 HTTP 驗證路由）
- [x] **3.3** 三條路徑同源皆通（本機 http://localhost 驗證 `/`、`/api/...`、`/stats-api/...` 全 200）
  - ⏳ 待辦：在 Droplet 設 `DOMAIN=真網域`，驗證自動 HTTPS（Phase 4）

## Phase 4 — 開 Droplet 並上線

> 狀態：🟡 Runbook 已備（`DEPLOY.md`）；實際上線需使用者操作 DO 帳號 + 網域 DNS

- [x] **4.0** 寫 `DEPLOY.md` 部署手冊（建 Droplet → DNS A record → ufw → Docker → clone → `.env.prod` → up → 驗證 → 更新 → 每日 pg_dump 備份 → 1GB swap → 疑難排解）
- [ ] **4.1** 建 Ubuntu Droplet、裝 Docker + Compose、設防火牆（22/80/443）← 待使用者
- [ ] **4.2** clone、填 `.env.prod`（`DOMAIN=真網域`）、`docker compose ... up -d --build` ← 待使用者
- [ ] **4.3** Caddy 自動簽 TLS（DNS 指對後自動）← 待使用者
- [ ] **4.4** 生產冒煙測試（同本機已驗證的流程）← 待使用者

## Phase 5 — 讓 README 誠實 + CI

> 狀態：✅ 完成（2026-06-05；三條 CI 線本機驗證全綠）

- [x] **5.1** 重寫 `Readme.md`：修正 Vite→Next.js、Nginx→Caddy、加入 Go 微服務、實際結構、架構圖（含 /stats-api + 單一寫入者）、ERD 表名對齊、連結 COMPONENTS/DEPLOY
- [x] **5.2** `.github/workflows/ci.yml`：3 個平行 job — backend(npm test+build)、frontend(tsc+build)、stats(go vet+test+build)。本機驗證：Go 綠、後端 18 測試綠、前端 build 綠

## Phase 6 — Chrome 擴充功能（方案 B：背景優先 MV3 + WXT）

> 狀態：⬜ 未開始　|　目錄：`extension/`

- [ ] **6.1** WXT + React + TS 專案骨架；抽共用 TS 型別（與 web 對齊）
- [ ] **6.2** Popup UI（計時顯示、開始/暫停/停止、今日進度）
- [ ] **6.3** Service worker 計時器：`chrome.alarms` + `chrome.storage.local` 存「結束時間戳」（背景常駐、休眠安全）
- [ ] **6.4** Auth：popup 登入表單打 `/api/auth/login`，token 存 `chrome.storage.local`
- [ ] **6.5** 工具列徽章倒數 + `chrome.notifications` 完成提醒
- [ ] **6.6** ★ 專注時封鎖分心網站：`declarativeNetRequest` 動態規則，休息/停止時解除
- [ ] **6.7** Session 同步：結束時 POST `/api/sessions`，離線排隊、恢復連線補送
- [ ] **6.8** Options page：focus modes / 設定
- [ ] **6.9** 後端 CORS 正式加入 `chrome-extension://<實際 id>`（呼應 0.4）
- [ ] **6.10** `web_accessible_resources` / 權限最小化；以 unpacked 載入做 demo（上架 Chrome Web Store 為選做）
  - 驗收：裝上擴充 → 登入 → 開始專注 → 徽章倒數 + 指定網站被封 → 結束後 session 出現在網頁版統計

## Phase 7 — 邏輯優化（選做，面試加分）

> 狀態：⬜ 未開始

- [ ] **7.1** session 記錄真實起訖時間與 `status`（COMPLETED / ABANDONED）— `backend/src/sessions/sessions.service.ts`
- [ ] **7.2**（選做）任務完成狀態可逆（調高預估後取消 `isCompleted`）
- [ ] **7.3**（選做）擴充上架 Chrome Web Store（$5 開發者費 + 審核）
- 註：舊計畫的「stats 時區 / N+1」已移由 **Phase 1 的 Go 服務**處理。

---

## 建議施作順序（關鍵路徑）

```
P0(修bug) → P2(容器化) → P3(Nginx+TLS) → P4(上線)   ← 先讓網頁版穩定上線
        ↘ P1(Go服務) 可併入 P2 之前或之後，建議在 P4 前完成以一起部署
P5(README+CI) → P6(擴充) → P7(優化)
```
- **里程碑 M1**：網頁版（含 Go stats）正式上線可 demo（完成 P0–P4）。
- **里程碑 M2**：README/CI 完備、repo 誠實（完成 P5）。
- **里程碑 M3**：擴充可裝可用、與網頁共用後端（完成 P6）。

---

## 體檢結果摘要（為什麼要做這些）

### 立即問題：線上 signup 卡住
`frontend/utils/api.ts` 的 `baseURL` 在 Vercel 未設 `NEXT_PUBLIC_API_URL` 時 fallback 到 `http://localhost:3000` → mixed-content 被擋 + 打本機 → 永不回；axios 無 timeout → 無限轉圈。→ P0.1 + 改同源 `/api` 解決。

### 架構 / 設計問題
| 嚴重度 | 問題 | 對應 Phase |
|--------|------|-----------|
| 🔴 高 | README 宣稱的 Dockerfile / compose.prod / Nginx / CI **全不存在** | 2, 3, 5 |
| 🔴 高 | JWT secret 硬編碼（兩處） | 0.3 |
| 🟠 中 | 無 ConfigModule / env 驗證 | 0.3 |
| 🟠 中 | CORS 全開 | 0.4 |
| 🟠 中 | 無後端 Dockerfile | 2.1 |
| 🟡 低 | auth 無 rate limiting | 0.5 |

### 功能邏輯問題
| 嚴重度 | 問題 | 對應 Phase |
|--------|------|-----------|
| 🔴 高 | signup `name` 後端必填、前端選填 → 誤導錯誤訊息 | 0.2 |
| 🟠 中 | 時區 bug：stats/heatmap 用伺服器時區分日 | **1.3（改 Go 解決）** |
| 🟠 中 | session 時間合成、status 永遠 COMPLETED | 7.1 |
| 🟡 低 | stats N+1 查詢 | **1.3（改 Go 解決）** |
| 🟡 低 | 任務完成不可逆 | 7.2 |

### 底子良好（已做對）
bcrypt 雜湊、JWT、ownership 檢查、`@Delete('all')` 路由順序、transaction 用法、ValidationPipe whitelist。

---

## 風險 / 依賴
- 🔴 **網域（D2）**：HTTPS 前置條件。
- 🟠 **JWT 共用 secret**：NestJS 與 Go 必須讀同一個 `JWT_SECRET` 且演算法一致（HS256）。
- 🟠 **Go ↔ 前端契約**：Go stats 回傳 JSON 結構必須對齊現有前端 `HeatmapSection` / `stats` 頁面期望，否則畫面壞。
- 🟠 **擴充計時精度**：必用「結束時間戳 + chrome.alarms」，勿用 setInterval 累加。
- 🟠 **DB migration**：正式環境用 `migrate deploy`（非 `dev`）。
- 🟡 **擴充上架**：封網站權限審核較嚴；demo 可用 unpacked 載入，不一定上架。
- 🟡 **Secrets 不進 git**；Droplet 維運（更新/備份）需自理。

## 複雜度估計：**高（capstone 等級）**
| Phase | 估時 |
|---|---|
| P0 修 bug | ~1 hr |
| P1 Go 服務 | ~1–1.5 天 |
| P2 容器化 | ~0.5 天 |
| P3 Nginx+TLS | ~0.5 天 |
| P4 上線 | ~0.5 天 |
| P5 README+CI | ~0.5 天 |
| P6 擴充(方案B) | ~4–5 天 |
| P7 優化 | ~0.5 天 |
| **合計** | **~8–11 天** |

---

## 進度日誌

| 日期 | 變更 | 完成項目 |
|------|------|---------|
| 2026-06-03 | 建立 plan、全面體檢、選定 DO Droplet 部署 | — |
| 2026-06-03 | 改版 v2：加入擴充方案 B（P6）、Go 分析微服務（P1）、調整架構與順序、stats 時區/N+1 改由 Go 處理 | — |
| 2026-06-04 | 架構審查通過（補上「單一寫入者」黃金規則）；確認 D2 網域已定；新增 `COMPONENTS.md` 組件功能說明 | — |
| 2026-06-05 | **Phase 0 完成**（D1/D3/D4 採建議：先網頁、Caddy、Go 只 stats）。TDD 修 0.1–0.5 + 修好 6 個壞測試 + 提前做 setGlobalPrefix + 新增 .env.example。後端 build/jest(18) 綠、前端 tsc 綠 | P0 全部 |
| 2026-06-05 | **Phase 1 完成**：`stats-service/` Go 微服務（chi+golang-jwt+pgx，分層、單次 GROUP BY+時區、distroless Dockerfile、README）；前端改打 `/stats-api`+tz。go test/vet/build 綠、前端 tsc 綠 | P1 全部 |
| 2026-06-05 | **Phase 2 完成 + Phase 3 大致完成**：5 個 Dockerfile/compose/Caddyfile/.env.prod.example；本機實際 build+up，端到端冒煙測試全通過（跨服務 JWT + 共用 DB 寫讀驗證）。修了 3 個雷：Prisma/Alpine openssl、dist/src/main 路徑、pgx 不吃 ?schema=public | P2 全部、P3.1–3.3 |
| 2026-06-05 | **Phase 4 runbook + Phase 5 完成**：`DEPLOY.md` 部署手冊（含每日備份/swap/疑難排解）；重寫 `Readme.md` 對齊實際；`ci.yml` 三線 CI。三條 CI 本機驗證全綠 | P4.0、P5 全部 |

---

## 給未來工作階段的提示
- 開工前先確認上方「待決策」D1–D4。
- 每完成一個子項：勾選 checkbox → 更新該 Phase 狀態 → 進度日誌加一列 → 更新頂部「最後更新」日期。
- 遵循 TDD：先寫測試（RED）→ 實作（GREEN）→ 重構。後端有 jest、Go 用 `testing`。
- Secrets 永不進 git。
- Go 服務與 NestJS 的 JWT 契約、Go 與前端的 JSON 契約，是最容易出錯的接縫，動到時要特別驗。
