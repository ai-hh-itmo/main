SHELL := /bin/sh

.DEFAULT_GOAL := help

.PHONY: help swagger test run build docker-build docker-run

help:
	@printf "%s\n" "Talentmine backend commands:"
	@printf "%s\n" "  make swagger      Generate Swagger/OpenAPI docs"
	@printf "%s\n" "  make test         Run Go tests"
	@printf "%s\n" "  make run          Run backend locally"
	@printf "%s\n" "  make build        Build backend binary"
	@printf "%s\n" "  make docker-build Build backend Docker image"
	@printf "%s\n" "  make docker-run   Run backend Docker image"

swagger:
	swag init --generalInfo main.go --dir .,internal/presentation/api,internal/model --output internal/presentation/docs --parseInternal

test:
	go test ./...

run:
	go run .

build:
	go build -o bin/backend .

docker-build:
	docker build -t talentmine-backend:latest .

docker-run:
	docker run --rm -p 8080:8080 --env-file .env talentmine-backend:latest
