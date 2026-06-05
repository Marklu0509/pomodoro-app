# ---- Stage 1: build a static binary ----
FROM golang:1.23-alpine AS builder

WORKDIR /src

# Cache dependencies first (layer caching: only re-runs when go.mod/sum change).
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO_ENABLED=0 -> fully static binary that runs on a minimal base image.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/statsd ./cmd/server

# ---- Stage 2: minimal runtime ----
# distroless/static has CA certs + runs as nonroot; no shell, tiny attack surface.
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/statsd /statsd

EXPOSE 4000
USER nonroot:nonroot
ENTRYPOINT ["/statsd"]
