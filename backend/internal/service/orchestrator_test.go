package service

import (
	"context"
	"errors"
	"testing"

	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/ai-hh-itmo/backend/internal/observability"
)

type fakeMLClient struct {
	summarizeResp model.SummarizerResponse
	embedResp     model.EmbedderResponse
	matchResp     model.MatcherResponse
	rankResp      model.RecSysResponse

	summarizeErr error
}

func (f fakeMLClient) Summarize(context.Context, model.SummarizerRequest) (model.SummarizerResponse, error) {
	return f.summarizeResp, f.summarizeErr
}

func (f fakeMLClient) Embed(context.Context, model.EmbedderRequest) (model.EmbedderResponse, error) {
	return f.embedResp, nil
}

func (f fakeMLClient) Match(context.Context, model.MatcherRequest) (model.MatcherResponse, error) {
	return f.matchResp, nil
}

func (f fakeMLClient) Rank(context.Context, model.RecSysRequest) (model.RecSysResponse, error) {
	return f.rankResp, nil
}

func TestRecommendHappyPath(t *testing.T) {
	client := fakeMLClient{
		summarizeResp: model.SummarizerResponse{Summary: "backend go senior"},
		embedResp:     model.EmbedderResponse{Embedding: []float64{0.1, 0.2}},
		matchResp: model.MatcherResponse{
			Candidates: []model.MatchCandidate{{CandidateID: "usr_1", CosineSimilarity: 0.9}},
		},
		rankResp: model.RecSysResponse{
			TopCandidates: []model.FinalCandidate{{CandidateID: "usr_1", FinalScore: 0.95}},
		},
	}

	orchestrator := NewOrchestrator(client, observability.NewMetrics())
	resp, err := orchestrator.Recommend(context.Background(), model.RecommendationRequest{
		VacancyText: "Go backend engineer",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(resp.TopCandidates) != 1 {
		t.Fatalf("expected 1 top candidate, got %d", len(resp.TopCandidates))
	}
	if resp.TopCandidates[0].CandidateID != "usr_1" {
		t.Fatalf("unexpected candidate_id: %s", resp.TopCandidates[0].CandidateID)
	}
}

func TestRecommendValidationError(t *testing.T) {
	orchestrator := NewOrchestrator(fakeMLClient{}, observability.NewMetrics())
	_, err := orchestrator.Recommend(context.Background(), model.RecommendationRequest{})
	if err == nil {
		t.Fatal("expected error for empty vacancy_text")
	}
}

func TestRecommendPropagatesSummarizerError(t *testing.T) {
	client := fakeMLClient{
		summarizeErr: errors.New("upstream timeout"),
	}
	orchestrator := NewOrchestrator(client, observability.NewMetrics())

	_, err := orchestrator.Recommend(context.Background(), model.RecommendationRequest{
		VacancyText: "Go backend engineer",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}
