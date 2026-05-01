package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ai-hh-itmo/backend/internal/logger"
	"github.com/ai-hh-itmo/backend/internal/model"
	"github.com/ai-hh-itmo/backend/internal/presentation/middleware"
)

// recommend godoc
// @Summary Create candidate recommendations
// @Description Runs the recommendation pipeline and returns ranked candidates for a vacancy.
// @Tags Recommendations
// @Accept json
// @Produce json
// @Param X-Request-Id header string false "Optional correlation ID"
// @Param request body model.RecommendationRequest true "Recommendation request"
// @Success 200 {object} model.RecommendationResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 502 {object} model.ErrorResponse
// @Header 200 {string} X-Request-Id "Correlation ID"
// @Header 400 {string} X-Request-Id "Correlation ID"
// @Header 502 {string} X-Request-Id "Correlation ID"
// @Router /api/v1/recommendations [post]
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
		c.JSON(http.StatusBadGateway, model.ErrorResponse{Error: "recommendation service is temporarily unavailable"})
		return
	}

	h.metrics.ObserveHTTP(false)
	logger.Info("recommendation success", "request_id", requestID, "duration", time.Since(start))
	c.JSON(200, resp)
}
