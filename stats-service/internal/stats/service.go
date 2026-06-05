// Package stats computes focus analytics (today summary, weekly trend, heatmap).
// The Service holds pure business logic and depends on the Repository interface,
// so it can be unit-tested without a real database.
package stats

import (
	"context"
	"math"
	"sort"
	"time"
)

const defaultDailyGoal = 120 // minutes, mirrors the old NestJS default

// Today is the "today" block of the summary response.
type Today struct {
	Minutes  int `json:"minutes"`
	Goal     int `json:"goal"`
	Progress int `json:"progress"` // 0..100
}

// WeeklyPoint is one bar in the weekly chart. Date is formatted "MM/dd".
type WeeklyPoint struct {
	Date    string `json:"date"`
	Minutes int    `json:"minutes"`
}

// SummaryResponse is the exact shape the frontend stats page expects.
type SummaryResponse struct {
	Today  Today         `json:"today"`
	Weekly []WeeklyPoint `json:"weekly"`
}

// HeatmapPoint is one cell. Date is "YYYY-MM-DD", Count is minutes.
type HeatmapPoint struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// Repository is the read-only data access this service needs.
// The Go service NEVER writes — NestJS owns the schema (single-writer rule).
type Repository interface {
	// MinutesByDay returns total focused minutes keyed by day ("YYYY-MM-DD"),
	// bucketed in loc's timezone, for the inclusive date range [from, to].
	// Only days that actually have sessions are present in the map.
	MinutesByDay(ctx context.Context, userID int, loc *time.Location, from, to time.Time) (map[string]int, error)
	// DailyGoal returns the user's configured daily goal in minutes (0 if unset).
	DailyGoal(ctx context.Context, userID int) (int, error)
}

// Service computes analytics from a Repository.
type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

const dayKeyFormat = "2006-01-02"

// Summary returns today's progress plus the last 7 days of focus minutes.
// `now` is injected so the logic is deterministic and testable.
func (s *Service) Summary(ctx context.Context, userID int, loc *time.Location, now time.Time) (SummaryResponse, error) {
	localNow := now.In(loc)
	from := startOfDay(localNow).AddDate(0, 0, -6) // 7-day window incl. today

	minutes, err := s.repo.MinutesByDay(ctx, userID, loc, from, localNow)
	if err != nil {
		return SummaryResponse{}, err
	}

	goal, err := s.repo.DailyGoal(ctx, userID)
	if err != nil {
		return SummaryResponse{}, err
	}
	if goal <= 0 {
		goal = defaultDailyGoal
	}

	weekly := buildWeekly(minutes, localNow)
	todayMinutes := minutes[localNow.Format(dayKeyFormat)]

	return SummaryResponse{
		Today: Today{
			Minutes:  todayMinutes,
			Goal:     goal,
			Progress: progressPercent(todayMinutes, goal),
		},
		Weekly: weekly,
	}, nil
}

// Heatmap returns up to a year of daily focus minutes (only non-empty days).
func (s *Service) Heatmap(ctx context.Context, userID int, loc *time.Location, now time.Time) ([]HeatmapPoint, error) {
	localNow := now.In(loc)
	from := localNow.AddDate(-1, 0, 0)

	minutes, err := s.repo.MinutesByDay(ctx, userID, loc, from, localNow)
	if err != nil {
		return nil, err
	}

	points := make([]HeatmapPoint, 0, len(minutes))
	for day, mins := range minutes {
		points = append(points, HeatmapPoint{Date: day, Count: mins})
	}
	// stable, chronological order for the frontend
	sortHeatmap(points)
	return points, nil
}

// buildWeekly produces exactly 7 points (oldest -> newest), filling days that
// have no sessions with 0 so the chart is continuous.
func buildWeekly(minutes map[string]int, localNow time.Time) []WeeklyPoint {
	const days = 7
	points := make([]WeeklyPoint, 0, days)
	start := startOfDay(localNow).AddDate(0, 0, -(days - 1))
	for i := 0; i < days; i++ {
		day := start.AddDate(0, 0, i)
		points = append(points, WeeklyPoint{
			Date:    day.Format("01/02"), // MM/dd, matches old NestJS output
			Minutes: minutes[day.Format(dayKeyFormat)],
		})
	}
	return points
}

// progressPercent returns minutes/goal as an integer percent clamped to [0,100].
func progressPercent(minutes, goal int) int {
	if goal <= 0 {
		return 0
	}
	p := int(math.Round(float64(minutes) / float64(goal) * 100))
	if p < 0 {
		return 0
	}
	if p > 100 {
		return 100
	}
	return p
}

func startOfDay(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, t.Location())
}

func sortHeatmap(points []HeatmapPoint) {
	sort.Slice(points, func(i, j int) bool { return points[i].Date < points[j].Date })
}
