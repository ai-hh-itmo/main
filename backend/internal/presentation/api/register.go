package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-hh-itmo/backend/internal/presentation/middleware"
)

func (h *Handler) Register(router *gin.Engine) {
	router.Use(middleware.RequestID())
	router.GET("/health", h.health)
	router.GET("/metrics", h.serveMetrics)
	router.GET("/openapi.json", h.openAPI)
	router.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	router.GET("/swagger/*any", swaggerHandler())
	router.POST("/api/v1/recommendations", h.recommend)
}
