package ml

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ai-hh-itmo/backend/internal/config"
	"github.com/ai-hh-itmo/backend/internal/model"
)

func TestClientSummarizeSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/summarizer/summarize" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"summary":"Go backend, 5+ years"}`))
	}))
	defer ts.Close()

	client := New(config.ClientConfig{
		RequestTimeout: 2 * time.Second,
		RetryCount:     0,
		RetryDelay:     1 * time.Millisecond,
	}, config.ServicesConfig{
		SummarizerURL: ts.URL,
		EmbedderURL:   ts.URL,
		MatcherURL:    ts.URL,
		RecSysURL:     ts.URL,
	})

	resp, err := client.Summarize(context.Background(), model.SummarizerRequest{VacancyText: "raw"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Summary == "" {
		t.Fatal("expected non-empty summary")
	}
}

func TestClientRetriesAndFails(t *testing.T) {
	var calls int
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		w.WriteHeader(http.StatusBadGateway)
		_, _ = w.Write([]byte(`{"error":"temporary issue"}`))
	}))
	defer ts.Close()

	client := New(config.ClientConfig{
		RequestTimeout: 2 * time.Second,
		RetryCount:     2,
		RetryDelay:     1 * time.Millisecond,
	}, config.ServicesConfig{
		SummarizerURL: ts.URL,
		EmbedderURL:   ts.URL,
		MatcherURL:    ts.URL,
		RecSysURL:     ts.URL,
	})

	_, err := client.Embed(context.Background(), model.EmbedderRequest{Text: "x"})
	if err == nil {
		t.Fatal("expected error")
	}
	if calls != 3 {
		t.Fatalf("expected 3 attempts, got %d", calls)
	}
}
