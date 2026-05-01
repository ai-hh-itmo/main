package service

import (
	"context"
	"fmt"
	"time"

	"github.com/ai-hh-itmo/backend/internal/logger"
	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/ai-hh-itmo/backend/internal/observability"
)

const (
	defaultTopN = 20
	defaultTopK = 1000
	maxTopN     = 500
	maxTopK     = 50000
)

type MLClient interface {
	Summarize(context.Context, model.SummarizerRequest) (model.SummarizerResponse, error)
	Embed(context.Context, model.EmbedderRequest) (model.EmbedderResponse, error)
	Match(context.Context, model.MatcherRequest) (model.MatcherResponse, error)
	Rank(context.Context, model.RecSysRequest) (model.RecSysResponse, error)
}

type Orchestrator struct {
	client  MLClient
	metrics *observability.Metrics
}

func NewOrchestrator(client MLClient, metrics *observability.Metrics) *Orchestrator {
	return &Orchestrator{
		client:  client,
		metrics: metrics,
	}
}

func (o *Orchestrator) Recommend(ctx context.Context, req model.RecommendationRequest) (model.RecommendationResponse, error) {
	topN, topK, err := validateAndDefaults(req)
	if err != nil {
		return model.RecommendationResponse{}, err
	}

	summarizerReq := model.SummarizerRequest{VacancyText: req.VacancyText}
	summaryResp, err := o.callSummarizer(ctx, summarizerReq)
	if err != nil {
		return model.RecommendationResponse{}, err
	}

	embedResp, err := o.callEmbedder(ctx, model.EmbedderRequest{Text: summaryResp.Summary})
	if err != nil {
		return model.RecommendationResponse{}, err
	}

	matchResp, err := o.callMatcher(ctx, model.MatcherRequest{
		VacancyEmbedding: embedResp.Embedding,
		TopK:             topK,
	})
	if err != nil {
		return model.RecommendationResponse{}, err
	}

	rankResp, err := o.callRecSys(ctx, model.RecSysRequest{
		Candidates: matchResp.Candidates,
		TopN:       topN,
	})
	if err != nil {
		return model.RecommendationResponse{}, err
	}

	return model.RecommendationResponse{TopCandidates: rankResp.TopCandidates}, nil
}

func validateAndDefaults(req model.RecommendationRequest) (int, int, error) {
	if req.VacancyText == "" {
		return 0, 0, fmt.Errorf("vacancy_text is required")
	}
	topN := req.TopN
	if topN == 0 {
		topN = defaultTopN
	}
	if topN < 1 || topN > maxTopN {
		return 0, 0, fmt.Errorf("top_n must be between 1 and %d", maxTopN)
	}

	topK := req.TopK
	if topK == 0 {
		topK = defaultTopK
	}
	if topK < 1 || topK > maxTopK {
		return 0, 0, fmt.Errorf("top_k must be between 1 and %d", maxTopK)
	}

	return topN, topK, nil
}

func (o *Orchestrator) callSummarizer(ctx context.Context, req model.SummarizerRequest) (model.SummarizerResponse, error) {
	start := time.Now()
	resp, err := o.client.Summarize(ctx, req)
	o.metrics.ObserveStage("summarizer", time.Since(start), err != nil)
	if err != nil {
		return model.SummarizerResponse{}, fmt.Errorf("summarizer failed: %w", err)
	}
	logger.Info("pipeline stage complete", "stage", "summarizer")
	return resp, nil
}

func (o *Orchestrator) callEmbedder(ctx context.Context, req model.EmbedderRequest) (model.EmbedderResponse, error) {
	start := time.Now()
	resp, err := o.client.Embed(ctx, req)
	o.metrics.ObserveStage("embedder", time.Since(start), err != nil)
	if err != nil {
		return model.EmbedderResponse{}, fmt.Errorf("embedder failed: %w", err)
	}
	logger.Info("pipeline stage complete", "stage", "embedder")
	return resp, nil
}

func (o *Orchestrator) callMatcher(ctx context.Context, req model.MatcherRequest) (model.MatcherResponse, error) {
	start := time.Now()
	resp, err := o.client.Match(ctx, req)
	o.metrics.ObserveStage("matcher", time.Since(start), err != nil)
	if err != nil {
		return model.MatcherResponse{}, fmt.Errorf("matcher failed: %w", err)
	}
	logger.Info("pipeline stage complete", "stage", "matcher")
	return resp, nil
}

func (o *Orchestrator) callRecSys(ctx context.Context, req model.RecSysRequest) (model.RecSysResponse, error) {
	start := time.Now()
	resp, err := o.client.Rank(ctx, req)
	o.metrics.ObserveStage("rec_sys", time.Since(start), err != nil)
	if err != nil {
		return model.RecSysResponse{}, fmt.Errorf("rec_sys failed: %w", err)
	}
	logger.Info("pipeline stage complete", "stage", "rec_sys")
	return resp, nil
}
