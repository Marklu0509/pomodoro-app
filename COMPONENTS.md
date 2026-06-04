# 組件功能說明 — Pomodoro 多端產品

> 本文件說明系統中**每一個組件**的職責、技術、輸入/輸出、關鍵檔案、以及它們如何互相串接。
> 目標讀者：團隊成員 / 面試官 / 未來的自己。
> 架構總覽與施作計畫見 [`CAPSTONE_PLAN.md`](./CAPSTONE_PLAN.md)。

---

## 系統全貌

```
   使用者
     │ 看畫面、點按鈕
     ▼
┌─────────────┐   ┌─────────────┐
│ 網頁前端     │   │ Chrome 擴充  │   ← 兩個前端，共用同一後端
│ (Next.js)   │   │ (WXT/MV3)   │
└──────┬──────┘   └──────┬──────┘
       │  HTTPS 請求 (夾帶 JWT)  │
       └───────────┬────────────┘
                   ▼
            ┌─────────────┐
            │ Nginx        │   ← 單一入口，依路徑分流 + TLS
            └──┬───────┬───┘
     /api/*    │       │   /stats-api/*
               ▼       ▼
   ┌──────────────┐  ┌──────────────┐
   │ NestJS 後端   │  │ Go 統計服務   │
   │ 認證/任務/設定 │  │ 唯讀分析       │
   │ (唯一寫入者)   │  │ (絕不寫入)     │
   └──────┬───────┘  └──────┬───────┘
          │   共用同一個 DB   │
          └────────┬─────────┘
                   ▼
            ┌─────────────┐
            │ PostgreSQL   │   ← 永久儲存
            └─────────────┘

   全部組件以 Docker 容器執行，由 docker-compose.prod.yml 編排，跑在一台 DO Droplet 上。
```

### 黃金規則（保持架構乾淨）
1. **單一寫入者**：只有 NestJS 寫資料庫並擁有 schema；**Go 服務唯讀，絕不寫、絕不跑 migration**。
2. **同源**：所有前端打同網域的 `/api`、`/stats-api`，由 Nginx 分流 → 無 CORS / mixed-content。
3. **無狀態認證**：NestJS 與 Go 共用同一把 `JWT_SECRET`，各自獨立驗證 token，不需共用登入狀態。

---

## 1. 網頁前端 — Frontend (Next.js)

| 項目 | 說明 |
|------|------|
| **職責** | 產生使用者在瀏覽器看到的畫面；收集輸入、呼叫後端、把結果畫出來 |
| **技術** | Next.js (App Router) + React + TypeScript + Tailwind |
| **它「不」做什麼** | 不加密、不判斷權限、不直接碰資料庫 —— 重要邏輯全在後端 |
| **關鍵檔案** | `frontend/app/page.tsx`（登入/註冊）、`app/dashboard/`、`app/stats/`、`app/components/Timer.tsx`、`app/components/HeatmapSection.tsx`、`frontend/utils/api.ts`（axios 實例） |
| **輸入** | 使用者的點擊與表單輸入 |
| **輸出** | HTTP 請求送往後端；把回應渲染成畫面 |
| **如何串接** | 透過 `utils/api.ts` 的 axios 實例呼叫 `/api/*`（任務/認證）與 `/stats-api/*`（統計）；每次請求自動夾帶 `localStorage` 裡的 JWT |

---

## 2. 瀏覽器擴充 — Extension (WXT / MV3)

| 項目 | 說明 |
|------|------|
| **職責** | 提供常駐瀏覽器的 Pomodoro 體驗，並做網頁版做不到的事 |
| **技術** | WXT + React + TypeScript，Manifest V3 |
| **獨有能力** | ① 背景常駐計時 ② 工具列徽章倒數 ③ 專注時封鎖分心網站 ④ 桌面通知 |
| **關鍵組成** | **Popup**（UI 視圖）、**Service Worker**（背景邏輯/計時）、**Options page**（focus modes 設定） |
| **計時器原理** | 用 `chrome.alarms` + 在 `chrome.storage.local` 存「**結束時間戳**」，顯示時用「結束時間 − 現在」回推；**不可用 `setInterval` 累加**（service worker 會被瀏覽器休眠） |
| **封網站原理** | 專注開始時用 `declarativeNetRequest` 加動態封鎖規則，休息/停止時移除 |
| **認證** | popup 登入表單打 `/api/auth/login`，token 存 `chrome.storage.local`，後續請求夾帶 |
| **如何串接** | 與網頁前端打**同一個**後端 `/api`、`/stats-api`；session 完成時 POST `/api/sessions`（離線時排隊，恢復連線補送） |

> 注意：後端 CORS 白名單需加入擴充的來源 `chrome-extension://<id>`。

---

## 3. 後端 API — Backend (NestJS)

| 項目 | 說明 |
|------|------|
| **職責** | 系統的核心邏輯與**唯一寫入者**：認證、任務、番茄鐘紀錄、設定、focus modes |
| **技術** | NestJS + TypeScript + Prisma(ORM) + Passport-JWT + bcrypt |
| **分層角色** | **Controller**（收請求）→ **Service**（邏輯）→ **Prisma**（存取 DB）；**DTO** 驗證輸入；**Guard** 守門；**Module** 組裝 |
| **關鍵檔案** | `backend/src/main.ts`（啟動/CORS/全域前綴）、`auth/`（認證）、`tasks/`、`sessions/`、`settings/`、`focus-modes/`、`prisma/` |
| **輸入** | 帶 JWT 的 HTTP 請求 + JSON body（經 DTO 驗證） |
| **輸出** | JSON 回應；對資料庫的讀寫 |
| **代表性邏輯** | 註冊：`bcrypt` 雜湊密碼 → 寫入 `users` → 簽發 JWT；建立 session：用 `$transaction` 同時寫紀錄 + 更新任務進度 |
| **路由前綴** | 全域 `setGlobalPrefix('api')`，所以對外路徑是 `/api/auth/...`、`/api/tasks/...` |
| **如何串接** | Nginx 把 `/api/*` 轉來；讀寫 PostgreSQL；簽發的 JWT 同時被自己與 Go 服務驗證 |

---

## 4. 統計服務 — Stats Service (Go)

| 項目 | 說明 |
|------|------|
| **職責** | 專責**讀取繁重的分析**：今日總分鐘、過去 7 天、一年熱力圖、連續天數 |
| **技術** | Go + `chi`(或 net/http) + `pgx`(Postgres driver) + `golang-jwt` |
| **為什麼獨立** | ① 讀取/聚合運算繁重，Go 快又輕 ② 關注點分離 ③ 展示 polyglot 微服務 |
| **重要限制** | **唯讀**：只 `SELECT`，絕不寫入、絕不跑 migration（守單一寫入者原則） |
| **關鍵設計** | 用單次 `GROUP BY` 聚合（取代舊 NestJS 版的 N+1）；**接收 client timezone 參數**正確分日（修掉時區 bug） |
| **端點** | `GET /stats-api/summary`、`/stats-api/weekly`、`/stats-api/heatmap` |
| **輸入** | 帶 JWT 的 HTTP 請求（用共用 `JWT_SECRET` 驗 HS256，取出 userId） |
| **輸出** | JSON（結構需對齊前端 `HeatmapSection`/`stats` 頁面期望） |
| **如何串接** | Nginx 把 `/stats-api/*` 轉來；唯讀同一個 PostgreSQL；驗證 NestJS 簽發的 JWT |

---

## 5. 資料庫 — PostgreSQL (+ Prisma)

| 項目 | 說明 |
|------|------|
| **職責** | 永久儲存所有資料；程式重啟資料不滅 |
| **技術** | PostgreSQL（關聯式資料庫）；Prisma 作為 NestJS 的 ORM（TS ↔ SQL 翻譯 + 型別） |
| **主要資料表** | `users`、`settings`、`focus_modes`、`tasks`、`pomodoro_sessions`（見 `backend/prisma/schema.prisma`） |
| **關聯方式** | 用外鍵 id 互指，例如 `tasks.user_id` → `users.id` |
| **schema 真相來源** | Prisma migrations（`backend/prisma/migrations/`）；正式環境用 `prisma migrate deploy` |
| **如何串接** | NestJS 透過 Prisma 讀寫；Go 透過 pgx 唯讀；資料以 Docker named volume 持久化 |

---

## 6. 反向代理 — Nginx

| 項目 | 說明 |
|------|------|
| **職責** | 系統的單一對外入口；依網址路徑把請求分流給正確的服務；終止 TLS(HTTPS) |
| **技術** | Nginx（或 Caddy，TLS 更自動）|
| **路由規則** | `/` → 前端、`/api/*` → NestJS、`/stats-api/*` → Go |
| **為什麼需要** | ① 對外只有一個網域 → 消除 CORS / mixed-content ② 統一 HTTPS ③ 隱藏內部服務拓撲 |
| **關鍵檔案** | `nginx/nginx.conf`（或 `Caddyfile`）|
| **輸入/輸出** | 收外部 HTTPS 請求 → 轉給內部容器 → 把回應轉回使用者 |

---

## 7. 容器化與編排 — Docker / Docker Compose

| 項目 | 說明 |
|------|------|
| **職責** | 把每個服務連同環境打包成可重現的容器；一鍵啟動整套系統 |
| **技術** | Docker（各服務 Dockerfile）+ docker-compose |
| **容器清單** | `db`(Postgres) + `backend`(NestJS) + `stats-service`(Go) + `frontend`(Next.js) + `nginx` |
| **關鍵檔案** | `docker-compose.prod.yml`、各服務 `Dockerfile`、`.env.prod`（不進 git） |
| **為什麼需要** | 解決「我電腦能跑、伺服器壞掉」；部署/更新只要 `docker compose up -d --build` |
| **如何串接** | Compose 建立內部網路讓容器互通；對外只開放 Nginx 的 80/443 |

---

## 跨組件機制 — 認證 (JWT)

> 這是把多個前端、多個後端「黏」起來的關鍵機制。

- **流程**：使用者登入 → NestJS 用 `JWT_SECRET` 簽發一張 token（內含 userId + 過期時間 + 簽名）。
- **攜帶**：之後每次請求都在 `Authorization: Bearer <token>` 標頭夾帶。
- **驗證**：NestJS 與 Go **各自**用同一把 `JWT_SECRET` 重算簽名、比對是否相符 → 不需查共用登入名單。
- **無狀態的好處**：請求落到哪台後端都能驗證 → 天生支援多後端 / 水平擴充。
- **安全注意**：JWT payload 只是編碼**非加密**（任何人可讀）→ 不可放機密；安全來自「簽名防竄改」。token 設短效期（目前 1 天）。

---

## 一次請求的完整輸入/輸出流程（範例：看熱力圖）

```
1. 使用者開啟「統計」頁
2. 前端送 GET /stats-api/heatmap（夾帶 JWT）
3. Nginx 看到 /stats-api → 轉給 Go 服務
4. Go 用共用 JWT_SECRET 驗證 token → 取出 userId
5. Go 對 PostgreSQL 下單次 GROUP BY 查詢（依日期聚合分鐘數）
6. Go 回傳 JSON：[{date, minutes}, ...]
7. 前端 HeatmapSection 把數字畫成色塊
```
**輸入 = 一次查詢請求；輸出 = 一張視覺化熱力圖。**

---

## 擴充性備案（規模長大時，每個組件怎麼演進）

| 階段 | 觸發 | 動作 | 受影響組件 |
|------|------|------|-----------|
| S0 現在 | 0～幾百人 | 一台 Droplet 跑全部容器 | 全部 |
| S1 垂直擴充 | 幾百～數千 | DO 一鍵把 Droplet 加大 | 無需改程式 |
| S2 分離資料庫 | 數千起 | Postgres 搬到 DO Managed DB（自動備份） | DB |
| S3 水平擴充 | 數萬+ | 前面加 Load Balancer，後端多開幾台（因無狀態，改動小） | Nginx/後端 |
| 未來 | 多消費者/高吞吐 | 改事件驅動：NestJS 發 `session.completed` 事件，Go 訂閱預算統計（可用 Kafka/RabbitMQ） | 後端/Go |

> 現在先停在 **S0**；撐不住才往下一階。能講清楚 S0→S3 的演進，本身就是面試亮點。
```
（資料安全的最小備案：現階段先用 cron + pg_dump 每日備份到 DO Spaces；到 S2 由 Managed DB 自動處理。）
```
