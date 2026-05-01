package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

const RequestIDHeader = "X-Request-Id"

func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader(RequestIDHeader)
		if requestID == "" {
			requestID = generateRequestID()
		}
		c.Writer.Header().Set(RequestIDHeader, requestID)
		c.Next()
	}
}

func generateRequestID() string {
	return time.Now().UTC().Format("20060102150405.000000000")
}
