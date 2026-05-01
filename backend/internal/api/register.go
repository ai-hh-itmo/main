package api

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-hh-itmo/backend/internal/middleware"
)

func (h *Handler) Register(router *gin.Engine) {
	router.Use(middleware.RequestID())
	router.GET("/health", h.health)
	router.GET("/metrics", h.serveMetrics)
	router.POST("/api/v1/recommendations", h.recommend)
}
