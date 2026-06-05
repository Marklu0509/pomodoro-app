package stats

import (
	"context"
	"testing"
	"time"
)

// fakeRepo implements Repository in-memory so we can test pure logic without a DB.
type fakeRepo struct {
	minutes map[string]int
	goal    int
}

func (f fakeRepo) MinutesByDay(_ context.Context, _ int, _ *time.Location, _, _ time.Time) (map[string]int, error) {
	return f.minutes, nil
}
func (f fakeRepo) DailyGoal(_ context.Context, _ int) (int, error) { return f.goal, nil }

// fixed reference point: Wed 2026-06-03 14:00 UTC
var refNow = time.Date(2026, 6, 3, 14, 0, 0, 0, time.UTC)

func TestSummary(t *testing.T) {
	tests := []struct {
		name         string
		minutes      map[string]int
		goal         int
		wantToday    int
		wantGoal     int
		wantProgress int
		wantWeekly   []WeeklyPoint
	}{
		{
			name:         "today below goal",
			minutes:      map[string]int{"2026-06-03": 60},
			goal:         120,
			wantToday:    60,
			wantGoal:     120,
			wantProgress: 50,
			wantWeekly: []WeeklyPoint{
				{"05/28", 0}, {"05/29", 0}, {"05/30", 0},
				{"05/31", 0}, {"06/01", 0}, {"06/02", 0}, {"06/03", 60},
			},
		},
		{
			name:         "progress clamped to 100 when over goal",
			minutes:      map[string]int{"2026-06-03": 300},
			goal:         120,
			wantToday:    300,
			wantGoal:     120,
			wantProgress: 100,
		},
		{
			name:         "zero goal falls back to default 120",
			minutes:      map[string]int{"2026-06-03": 60},
			goal:         0,
			wantToday:    60,
			wantGoal:     120,
			wantProgress: 50,
		},
		{
			name:         "gap filling: only some days have data",
			minutes:      map[string]int{"2026-06-01": 25, "2026-06-03": 50},
			goal:         100,
			wantToday:    50,
			wantGoal:     100,
			wantProgress: 50,
			wantWeekly: []WeeklyPoint{
				{"05/28", 0}, {"05/29", 0}, {"05/30", 0},
				{"05/31", 0}, {"06/01", 25}, {"06/02", 0}, {"06/03", 50},
			},
		},
	}

	svc := NewService(fakeRepo{})
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc.repo = fakeRepo{minutes: tt.minutes, goal: tt.goal}

			got, err := svc.Summary(context.Background(), 1, time.UTC, refNow)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Today.Minutes != tt.wantToday {
				t.Errorf("today.minutes = %d, want %d", got.Today.Minutes, tt.wantToday)
			}
			if got.Today.Goal != tt.wantGoal {
				t.Errorf("today.goal = %d, want %d", got.Today.Goal, tt.wantGoal)
			}
			if got.Today.Progress != tt.wantProgress {
				t.Errorf("today.progress = %d, want %d", got.Today.Progress, tt.wantProgress)
			}
			if len(got.Weekly) != 7 {
				t.Fatalf("weekly length = %d, want 7", len(got.Weekly))
			}
			if tt.wantWeekly != nil {
				for i, wp := range tt.wantWeekly {
					if got.Weekly[i] != wp {
						t.Errorf("weekly[%d] = %+v, want %+v", i, got.Weekly[i], wp)
					}
				}
			}
		})
	}
}

func TestHeatmap(t *testing.T) {
	svc := NewService(fakeRepo{
		minutes: map[string]int{"2026-06-03": 50, "2026-01-01": 10, "2026-03-15": 30},
	})

	got, err := svc.Heatmap(context.Background(), 1, time.UTC, refNow)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("len = %d, want 3", len(got))
	}
	// must be chronologically sorted
	wantOrder := []string{"2026-01-01", "2026-03-15", "2026-06-03"}
	for i, d := range wantOrder {
		if got[i].Date != d {
			t.Errorf("point[%d].date = %s, want %s", i, got[i].Date, d)
		}
	}
	if got[2].Count != 50 {
		t.Errorf("count = %d, want 50", got[2].Count)
	}
}

func TestProgressPercent(t *testing.T) {
	cases := []struct{ minutes, goal, want int }{
		{0, 120, 0},
		{60, 120, 50},
		{120, 120, 100},
		{300, 120, 100}, // clamp
		{50, 0, 0},      // guard against divide-by-zero
	}
	for _, c := range cases {
		if got := progressPercent(c.minutes, c.goal); got != c.want {
			t.Errorf("progressPercent(%d,%d) = %d, want %d", c.minutes, c.goal, got, c.want)
		}
	}
}
