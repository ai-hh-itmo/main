package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/ai-hh-itmo/backend/internal/observability"
	"github.com/gin-gonic/gin"
)

type fakeRecommendationService struct {
	resp model.RecommendationResponse
	err  error
}

func (f fakeRecommendationService) Recommend(context.Context, model.RecommendationRequest) (model.RecommendationResponse, error) {
	return f.resp, f.err
}

func TestRecommendHandlerHappyPath(t *testing.T) {
	svc := fakeRecommendationService{
		resp: model.RecommendationResponse{
			TopCandidates: []model.FinalCandidate{{CandidateID: "usr_1", FinalScore: 0.99}},
		},
	}
	h := NewHandler(svc, observability.NewMetrics())
	gin.SetMode(gin.TestMode)
	router := gin.New()
	h.Register(router)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/recommendations", bytes.NewBufferString(`{"vacancy_text":"go dev"}`))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Header().Get("X-Request-Id") == "" {
		t.Fatal("expected X-Request-Id header")
	}
}

func TestRecommendHandlerBadRequest(t *testing.T) {
	svc := fakeRecommendationService{}
	h := NewHandler(svc, observability.NewMetrics())
	gin.SetMode(gin.TestMode)
	router := gin.New()
	h.Register(router)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/recommendations", bytes.NewBufferString("{"))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestRecommendHandlerUpstreamError(t *testing.T) {
	internalErr := `summarizer failed: send request: Post "http://host.docker.internal:8000/api/v1/summarizer/summarize": dial tcp 192.168.65.254:8000: connect: connection refused`
	svc := fakeRecommendationService{err: errors.New(internalErr)}
	h := NewHandler(svc, observability.NewMetrics())
	gin.SetMode(gin.TestMode)
	router := gin.New()
	h.Register(router)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/recommendations", bytes.NewBufferString(`{"vacancy_text":"go dev"}`))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", rec.Code)
	}

	var body model.ErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body.Error != "recommendation service is temporarily unavailable" {
		t.Fatalf("unexpected public error: %q", body.Error)
	}
	if strings.Contains(rec.Body.String(), "host.docker.internal") ||
		strings.Contains(rec.Body.String(), "dial tcp") ||
		strings.Contains(rec.Body.String(), "summarizer failed") {
		t.Fatalf("response leaked internal error: %s", rec.Body.String())
	}
}
