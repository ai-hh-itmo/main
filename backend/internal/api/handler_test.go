package api

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
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
	svc := fakeRecommendationService{err: errors.New("upstream unavailable")}
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
}
