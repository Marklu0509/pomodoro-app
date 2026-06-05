package stats

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PgRepository is the read-only PostgreSQL implementation of Repository.
// It only runs SELECTs — NestJS owns the schema and all writes.
type PgRepository struct {
	pool *pgxpool.Pool
}

func NewPgRepository(pool *pgxpool.Pool) *PgRepository {
	return &PgRepository{pool: pool}
}

// MinutesByDay aggregates focus minutes per day in a SINGLE query.
// The timezone conversion + GROUP BY happen in Postgres, which fixes both the
// old N+1 (7 queries in a loop) and the server-timezone bucketing bug.
func (r *PgRepository) MinutesByDay(
	ctx context.Context,
	userID int,
	loc *time.Location,
	from, to time.Time,
) (map[string]int, error) {
	const query = `
		SELECT
			to_char((start_time AT TIME ZONE 'UTC' AT TIME ZONE $2)::date, 'YYYY-MM-DD') AS day,
			COALESCE(SUM(duration_seconds), 0) / 60 AS minutes
		FROM pomodoro_sessions
		WHERE user_id = $1
		  AND start_time >= $3
		  AND start_time <= $4
		GROUP BY day
	`

	rows, err := r.pool.Query(ctx, query, userID, loc.String(), from.UTC(), to.UTC())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var day string
		var minutes int
		if err := rows.Scan(&day, &minutes); err != nil {
			return nil, err
		}
		result[day] = minutes
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

// DailyGoal returns the user's configured goal, or 0 when no settings row exists.
func (r *PgRepository) DailyGoal(ctx context.Context, userID int) (int, error) {
	const query = `SELECT daily_goal FROM settings WHERE user_id = $1`

	var goal int
	err := r.pool.QueryRow(ctx, query, userID).Scan(&goal)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return goal, nil
}
