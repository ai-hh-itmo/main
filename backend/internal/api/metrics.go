package api

import "github.com/gin-gonic/gin"

func (h *Handler) serveMetrics(c *gin.Context) {
	h.metrics.Handler().ServeHTTP(c.Writer, c.Request)
}
