package stats

import (
	"net/http"
	"time"

	"github.com/Marklu0509/pomodoro-app/stats-service/internal/auth"
	"github.com/Marklu0509/pomodoro-app/stats-service/internal/httpx"
)

// Handler exposes the stats Service over HTTP.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// Summary handles GET /stats-api/summary?tz=Area/City
func (h *Handler) Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	loc := parseTimezone(r.URL.Query().Get("tz"))

	resp, err := h.svc.Summary(r.Context(), userID, loc, time.Now())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to compute summary")
		return
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// Heatmap handles GET /stats-api/heatmap?tz=Area/City
func (h *Handler) Heatmap(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	loc := parseTimezone(r.URL.Query().Get("tz"))

	resp, err := h.svc.Heatmap(r.Context(), userID, loc, time.Now())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "failed to compute heatmap")
		return
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// parseTimezone resolves an IANA timezone string, defaulting to UTC when the
// param is empty or invalid (never trust client input).
func parseTimezone(tz string) *time.Location {
	if tz == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}
