package api

import "github.com/gin-gonic/gin"

func (h *Handler) health(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
