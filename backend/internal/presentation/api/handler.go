package api

import (
	"context"

	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/ai-hh-itmo/backend/internal/observability"
)

type recommendationService interface {
	Recommend(context.Context, model.RecommendationRequest) (model.RecommendationResponse, error)
}

type Handler struct {
	service recommendationService
	metrics *observability.Metrics
}

func NewHandler(service recommendationService, metrics *observability.Metrics) *Handler {
	return &Handler{
		service: service,
		metrics: metrics,
	}
}
