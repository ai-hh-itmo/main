package api

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ai-hh-itmo/backend/internal/logger"
	"github.com/ai-hh-itmo/backend/internal/middleware"
	"github.com/ai-hh-itmo/backend/internal/model"
)

func (h *Handler) recommend(c *gin.Context) {
	start := time.Now()
	requestID := c.GetHeader(middleware.RequestIDHeader)

	var req model.RecommendationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.metrics.ObserveHTTP(true)
		logger.Error("invalid request json", "request_id", requestID, "err", err)
		c.JSON(400, model.ErrorResponse{Error: "invalid json"})
		return
	}

	resp, err := h.service.Recommend(c.Request.Context(), req)
	if err != nil {
		h.metrics.ObserveHTTP(true)
		logger.Error("recommendation failed", "request_id", requestID, "err", err, "duration", time.Since(start))
		c.JSON(502, model.ErrorResponse{Error: err.Error()})
		return
	}

	h.metrics.ObserveHTTP(false)
	logger.Info("recommendation success", "request_id", requestID, "duration", time.Since(start))
	c.JSON(200, resp)
}
