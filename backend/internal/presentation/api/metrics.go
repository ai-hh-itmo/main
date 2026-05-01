package api

import "github.com/gin-gonic/gin"

// serveMetrics godoc
// @Summary Prometheus metrics
// @Description Returns Prometheus exposition metrics.
// @Tags System
// @Produce plain
// @Success 200 {string} string "Prometheus metrics"
// @Header 200 {string} X-Request-Id "Correlation ID"
// @Router /metrics [get]
func (h *Handler) serveMetrics(c *gin.Context) {
	h.metrics.Handler().ServeHTTP(c.Writer, c.Request)
}
