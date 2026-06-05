package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-key-at-least-16-chars"

// helper: build a signed token the same way NestJS does (HS256, numeric `sub`).
func makeToken(t *testing.T, secret string, sub int, exp time.Time, method jwt.SigningMethod) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub":   sub,
		"email": "user@example.com",
		"exp":   exp.Unix(),
	}
	token := jwt.NewWithClaims(method, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func TestMiddleware(t *testing.T) {
	// downstream handler records the userId the middleware extracted.
	var gotUserID int
	var reached bool
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reached = true
		id, ok := UserIDFromContext(r.Context())
		if !ok {
			t.Error("expected userId in context")
		}
		gotUserID = id
		w.WriteHeader(http.StatusOK)
	})

	tests := []struct {
		name       string
		authHeader string
		wantStatus int
		wantUserID int
	}{
		{
			name:       "valid token passes and sets userId",
			authHeader: "Bearer " + makeToken(t, testSecret, 42, time.Now().Add(time.Hour), jwt.SigningMethodHS256),
			wantStatus: http.StatusOK,
			wantUserID: 42,
		},
		{
			name:       "missing header is rejected",
			authHeader: "",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "wrong secret is rejected",
			authHeader: "Bearer " + makeToken(t, "a-different-wrong-secret-key", 42, time.Now().Add(time.Hour), jwt.SigningMethodHS256),
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "expired token is rejected",
			authHeader: "Bearer " + makeToken(t, testSecret, 42, time.Now().Add(-time.Hour), jwt.SigningMethodHS256),
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reached = false
			gotUserID = 0

			req := httptest.NewRequest(http.MethodGet, "/stats-api/summary", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			rec := httptest.NewRecorder()

			handler := Middleware(testSecret)(next)
			handler.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusOK {
				if !reached {
					t.Error("expected downstream handler to be reached")
				}
				if gotUserID != tt.wantUserID {
					t.Errorf("userId = %d, want %d", gotUserID, tt.wantUserID)
				}
			} else if reached {
				t.Error("downstream handler should NOT be reached on auth failure")
			}
		})
	}
}
