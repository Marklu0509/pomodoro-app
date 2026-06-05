// Command server starts the Go stats microservice.
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	// Embed the IANA timezone database into the binary so time.LoadLocation
	// works even on a minimal scratch/distroless image with no system tzdata.
	_ "time/tzdata"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Marklu0509/pomodoro-app/stats-service/internal/auth"
	"github.com/Marklu0509/pomodoro-app/stats-service/internal/config"
	"github.com/Marklu0509/pomodoro-app/stats-service/internal/httpx"
	"github.com/Marklu0509/pomodoro-app/stats-service/internal/stats"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	// Connection pool: reuse a set of DB connections instead of opening one per request.
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Wire the layers: repo (data) -> service (logic) -> handler (HTTP).
	repo := stats.NewPgRepository(pool)
	svc := stats.NewService(repo)
	handler := stats.NewHandler(svc)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Liveness probe (no auth) for Docker/Nginx health checks.
	r.Get("/stats-api/health", func(w http.ResponseWriter, _ *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Authenticated analytics endpoints. Same JWT_SECRET as NestJS (HS256).
	r.Group(func(protected chi.Router) {
		protected.Use(auth.Middleware(cfg.JWTSecret))
		protected.Get("/stats-api/summary", handler.Summary)
		protected.Get("/stats-api/heatmap", handler.Heatmap)
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("stats-service listening on :%s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
