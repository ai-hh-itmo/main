FROM golang:1.26.2-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /out/backend ./cmd/server

# Runtime: scratch + CA bundle only (no distro packages → no base-image CVEs in final layer).
FROM scratch

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /out/backend /app/backend

# Explicit non-root UID/GID; satisfies scanners that require a USER instruction (e.g. Trivy DS-0002).
USER 65532:65532

EXPOSE 8080

ENTRYPOINT ["/app/backend"]
