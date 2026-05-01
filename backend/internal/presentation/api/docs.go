package api

import (
	"net/http"

	"github.com/ai-hh-itmo/backend/internal/presentation/docs"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (h *Handler) openAPI(c *gin.Context) {
	c.Data(http.StatusOK, "application/json; charset=utf-8", []byte(docs.SwaggerInfo.ReadDoc()))
}

func swaggerHandler() gin.HandlerFunc {
	return ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/openapi.json"))
}
