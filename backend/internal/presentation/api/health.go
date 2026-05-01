package api

import "github.com/gin-gonic/gin"

// health godoc
// @Summary Health check
// @Description Returns service health status.
// @Tags System
// @Produce json
// @Success 200 {object} map[string]string
// @Header 200 {string} X-Request-Id "Correlation ID"
// @Router /health [get]
func (h *Handler) health(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
