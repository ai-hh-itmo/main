package ml

import (
	"context"
	"fmt"

	"github.com/ai-hh-itmo/backend/internal/config"
	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/go-resty/resty/v2"
)

type Client struct {
	httpClient    *resty.Client
	services      config.ServicesConfig
}

func New(cfg config.ClientConfig, services config.ServicesConfig) *Client {
	httpClient := resty.New().
		SetTimeout(cfg.RequestTimeout).
		SetRetryCount(max(cfg.RetryCount, 0)).
		AddRetryCondition(func(resp *resty.Response, err error) bool {
			return err != nil || resp.IsError()
		})

	if cfg.RetryDelay > 0 {
		httpClient.SetRetryWaitTime(cfg.RetryDelay)
		httpClient.SetRetryMaxWaitTime(cfg.RetryDelay)
	}

	return &Client{
		httpClient:    httpClient,
		services:      services,
	}
}

func (c *Client) Summarize(ctx context.Context, req model.SummarizerRequest) (model.SummarizerResponse, error) {
	var resp model.SummarizerResponse
	err := c.post(ctx, c.services.SummarizerURL+"/api/v1/summarizer/summarize", req, &resp)
	return resp, err
}

func (c *Client) Embed(ctx context.Context, req model.EmbedderRequest) (model.EmbedderResponse, error) {
	var resp model.EmbedderResponse
	err := c.post(ctx, c.services.EmbedderURL+"/api/v1/embedder/embed", req, &resp)
	return resp, err
}

func (c *Client) Match(ctx context.Context, req model.MatcherRequest) (model.MatcherResponse, error) {
	var resp model.MatcherResponse
	err := c.post(ctx, c.services.MatcherURL+"/api/v1/matcher/match", req, &resp)
	return resp, err
}

func (c *Client) Rank(ctx context.Context, req model.RecSysRequest) (model.RecSysResponse, error) {
	var resp model.RecSysResponse
	err := c.post(ctx, c.services.RecSysURL+"/api/v1/rec-sys/rank", req, &resp)
	return resp, err
}

func (c *Client) post(ctx context.Context, url string, reqBody any, out any) error {
	resp, err := c.httpClient.R().
		SetContext(ctx).
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		SetResult(out).
		Post(url)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}

	if resp.IsError() {
		return fmt.Errorf("non-success response status=%d body=%s", resp.StatusCode(), resp.String())
	}

	return nil
}
