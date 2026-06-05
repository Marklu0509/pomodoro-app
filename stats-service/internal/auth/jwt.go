// Package auth verifies JWTs issued by the NestJS backend.
// Both services share the same JWT_SECRET (HS256), so this service can
// authenticate requests independently — no shared session store needed.
package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// ctxKey is an unexported type so no other package can collide with our
// context key. This is the idiomatic Go way to store request-scoped values.
type ctxKey string

const userIDKey ctxKey = "userID"

// Middleware returns net/http middleware that rejects requests without a
// valid Bearer token and, on success, stores the user id in the request context.
func Middleware(secret string) func(http.Handler) http.Handler {
	secretBytes := []byte(secret)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenString, ok := extractBearer(r.Header.Get("Authorization"))
			if !ok {
				http.Error(w, "missing or malformed Authorization header", http.StatusUnauthorized)
				return
			}

			claims := jwt.MapClaims{}
			_, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
				// SECURITY: only accept HMAC signing. Without this check an
				// attacker could swap the algorithm (alg=none / RS256 confusion).
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return secretBytes, nil
			})
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			userID, ok := subjectToInt(claims["sub"])
			if !ok {
				http.Error(w, "invalid token subject", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext retrieves the authenticated user id set by Middleware.
func UserIDFromContext(ctx context.Context) (int, bool) {
	id, ok := ctx.Value(userIDKey).(int)
	return id, ok
}

func extractBearer(header string) (string, bool) {
	const prefix = "Bearer "
	if len(header) <= len(prefix) || !strings.EqualFold(header[:len(prefix)], prefix) {
		return "", false
	}
	return strings.TrimSpace(header[len(prefix):]), true
}

// subjectToInt converts the JWT `sub` claim to an int. JSON numbers decode to
// float64, but NestJS may also encode it as a string, so handle both.
func subjectToInt(sub any) (int, bool) {
	switch v := sub.(type) {
	case float64:
		return int(v), true
	case int:
		return v, true
	case json.Number:
		n, err := v.Int64()
		return int(n), err == nil
	default:
		return 0, false
	}
}
