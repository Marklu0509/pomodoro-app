## Development Workflow
```mermaid
graph TD
    %% 樣式設定
    classDef planning fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef devops fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef frontend fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef polish fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;

    %% 第一階段
    subgraph P1 [第一階段：架構設計與規格]
        A1[資料庫關聯設計<br/>dbdiagram.io]:::planning --> A2[API 規格定義<br/>Swagger/OpenAPI]:::planning
        A2 --> A3[UI 功能草圖<br/>Excalidraw]:::planning
    end

    %% 第二階段
    subgraph P2 [第二階段：基礎建設 (DevOps)]
        B1[初始化 Monorepo 專案結構]:::devops --> B2[Docker 環境建置<br/>PostgreSQL + Network]:::devops
        B2 --> B3[Git 規範與代碼檢查<br/>Prettier/ESLint]:::devops
    end

    %% 第三階段
    subgraph P3 [第三階段：後端核心開發]
        C1[NestJS 初始化與 DB 連線<br/>Prisma ORM]:::backend --> C2[會員認證模組<br/>JWT Strategy]:::backend
        C2 --> C3[核心商業邏輯 API<br/>任務與計時器 CRUD]:::backend
        C3 --> C4[撰寫單元測試<br/>Jest]:::backend
    end

    %% 第四階段
    subgraph P4 [第四階段：自動化流程 (CI/CD)]
        D1[GitHub Actions 腳本<br/>自動測試與建置]:::devops --> D2[優化 Docker Image<br/>Multi-stage Builds]:::devops
    end

    %% 第五階段
    subgraph P5 [第五階段：前端介面實作]
        E1[React + Vite 初始化]:::frontend --> E2[UI 元件庫安裝<br/>Shadcn/UI]:::frontend
        E2 --> E3[串接後端 API<br/>Axios / React Query]:::frontend
        E3 --> E4[客戶端邏輯實作<br/>倒數計時狀態]:::frontend
    end

    %% 第六階段
    subgraph P6 [第六階段：包裝與發布]
        F1[最終除錯與優化]:::polish --> F2[撰寫 README 文件<br/>架構圖與技術說明]:::polish
        F2 --> F3[錄製 Demo 演示 GIF]:::polish
    end

    %% 流程連接
    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
    P5 --> P6
```

