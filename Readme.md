# 🍅 FocusFlow: Enterprise-Grade Pomodoro Application

> A full-stack, DevOps-enabled productivity tool designed to demonstrate modern software architecture, containerization, and clean code practices.

### 📖 Introduction
**FocusFlow** is not just another timer; it's a solution for the distracted mind, built with the rigor of an enterprise application. It combines the **Pomodoro Technique** with **Task Management** to help users achieve deep work states.

This project serves as a portfolio showcase demonstrating:
* **System Architecture**: Clean Architecture principles with a decoupled frontend and backend.
* **DevOps Mindset**: Fully containerized environment using Docker & automated CI/CD pipelines.
* **Data Integrity**: Robust database schema design with PostgreSQL and Prisma ORM.
* **Type Safety**: End-to-end type safety using TypeScript.

---

### 🛠 Tech Stack

**Backend & Database**
* ![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white) **NestJS**: For scalable server-side architecture.
* ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) **PostgreSQL**: Relational database for persistent data storage.
* ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) **Prisma**: Next-generation ORM.
* ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) **JWT**: Secure stateless authentication.

**Frontend**
* ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) **React (Vite)**: Fast and responsive UI.
* ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) **TypeScript**: For static typing and code reliability.
* ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS / Shadcn UI**: For modern styling.

**DevOps & Infrastructure**
* ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white) **Docker & Compose**: Containerization for consistent environments.
* ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) **GitHub Actions**: CI/CD for automated testing and checks.




#Structure
```text
pomodoro-monorepo/
├── .github/
│   └── workflows/
│       ├── ci-backend.yml    # 後端自動測試與檢查
│       └── ci-frontend.yml   # 前端建置檢查
├── backend/                  # NestJS 專案
│   ├── src/
│   ├── Dockerfile            # 後端映像檔設定 (Multi-stage build)
│   ├── .env.example          # 環節變數範本 (不包含敏感資料)
│   └── package.json
├── frontend/                 # React + Vite 專案
│   ├── src/
│   ├── Dockerfile            # 前端映像檔設定 (Nginx hosting)
│   └── package.json
├── docker-compose.yml        # 一鍵啟動整個開發環境
├── docker-compose.prod.yml   # 生產環境配置 (模擬)
└── README.md                 # 專案門面
```



#ERDiagram
```mermaid
erDiagram
    %% Core Identity
    users {
        int id PK "Primary Key"
        varchar email UK "Unique, Indexed"
        varchar password_hash "Bcrypt hash"
        varchar display_name
        timestamp created_at "Default NOW()"
        timestamp updated_at
    }

    %% User Preferences (1:1 Relationship)
    user_settings {
        int id PK
        int user_id FK "Foreign Key -> users.id"
        int focus_duration_min "Default: 25"
        int short_break_min "Default: 5"
        int long_break_min "Default: 15"
        boolean auto_start_breaks "Default: false"
        boolean auto_start_pomodoros "Default: false"
        timestamp updated_at
    }

    %% Task Management (1:N Relationship)
    tasks {
        int id PK
        int user_id FK "Foreign Key -> users.id"
        varchar title
        text description "Nullable"
        int estimated_pomodoros "Target count"
        int completed_pomodoros "Cached count"
        boolean is_completed
        boolean is_archived "Soft delete flag"
        timestamp created_at
        timestamp updated_at
    }

    %% Pomodoro History (The Core Data)
    pomodoro_sessions {
        int id PK
        int user_id FK "Foreign Key -> users.id"
        int task_id FK "Nullable, Foreign Key -> tasks.id"
        timestamp start_time
        timestamp end_time
        int duration_seconds "Actual focus time"
        varchar status "COMPLETED | INTERRUPTED"
        timestamp created_at
    }

    %% Relationships
    users ||--|| user_settings : "configures"
    users ||--o{ tasks : "owns"
    users ||--o{ pomodoro_sessions : "generates"
    tasks |o--o{ pomodoro_sessions : "tracks"
```




#Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    
    actor Client as Client (React/Vite)
    participant Guard as AuthGuard (JWT)
    participant Ctrl as SessionsController
    participant Svc as SessionsService
    participant DB as Prisma/Postgres

    Note over Client: Timer finishes (25:00)

    Client->>Guard: POST /api/v1/sessions
    Note right of Client: Header: Bearer <token><br/>Body: CreateSessionDto { taskId, duration }

    activate Guard
    Guard->>Guard: Validate Token
    Guard-->>Ctrl: Pass (User Context)
    deactivate Guard

    activate Ctrl
    Ctrl->>Svc: create(userId, createSessionDto)
    activate Svc

    %% Business Logic
    alt Task ID provided
        Svc->>DB: findTask(taskId)
        DB-->>Svc: Task Entity
        
        break Task not owned by user
            Svc-->>Ctrl: Throw ForbiddenException
            Ctrl-->>Client: 403 Forbidden
        end
    end

    Svc->>DB: createSession(data)
    DB-->>Svc: Session Entity (Created)

    %% Optional: Update Task Progress
    opt Link to Task
        Svc->>DB: updateTask(increment_count)
    end

    Svc-->>Ctrl: Session Entity
    deactivate Svc

    Ctrl-->>Client: 201 Created (JSON)
    deactivate Ctrl
```



#High-Level System Architecture
```mermaid
graph TD
    %% Styling
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef proxy fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef app fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;

    %% 修正點：加上雙引號 ["..."] 以支援括號
    subgraph Host ["Host Machine (Local or Cloud VPS)"]
        
        %% Client Browser
        Browser[Client Browser]:::client
        
        %% Docker Network Boundary
        subgraph DockerNetwork ["Docker Network"]
            direction TB
            
            %% Reverse Proxy
            Nginx[Nginx Reverse Proxy<br/>Port: 80/443]:::proxy
            
            %% Frontend Container
            Frontend[Frontend Container<br/>React/Vite App<br/>Port: 80]:::app
            
            %% Backend Container
            Backend[Backend Container<br/>NestJS API<br/>Port: 3000]:::app
            
            %% Database Container
            DB[(PostgreSQL DB<br/>Port: 5432)]:::data
        end
        
        %% Data Persistence
        Volume[Docker Volume<br/>pg_data]:::data
    end

    %% Connections
    Browser -- "HTTP Requests" --> Nginx
    Nginx -- "Static Assets" --> Frontend
    Nginx -- "/api/*" --> Backend
    Backend -- "Prisma Client (TCP)" --> DB
    DB -.-> Volume
```


#State Machine
```mermaid
stateDiagram-v2
    %% Styling
    classDef work fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef break fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef idle fill:#f5f5f5,stroke:#333,stroke-width:2px;

    [*] --> Idle:::idle

    state "Idle (Ready)" as Idle
    state "Focus Session (Running)" as Focus:::work
    state "Paused" as Paused
    state "Short Break (5m)" as ShortBreak:::break
    state "Long Break (15m)" as LongBreak:::break
    
    %% Logic Flow
    Idle --> Focus : Start Timer
    
    Focus --> Paused : User Pauses
    Paused --> Focus : User Resumes
    Paused --> Idle : User Aborts

    Focus --> DecisionPoint : Timer Finishes
    state DecisionPoint <<choice>>

    %% Business Logic: 4th pomodoro leads to long break
    DecisionPoint --> ShortBreak : Count < 4
    DecisionPoint --> LongBreak : Count % 4 == 0

    ShortBreak --> Idle : Break Ends
    LongBreak --> Idle : Break Ends
```
