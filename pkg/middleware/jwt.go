package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"mono/gateway/response"
	"mono/pkg/jwt"
)

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("authorization")
		if tokenStr == "" {
			response.AuthFail(c)
			c.Abort()
			return
		}

		tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")

		claims, err := jwt.ParseToken(tokenStr)
		if err != nil || claims == nil {
			response.AuthFail(c)
			c.Abort()
			return
		}
		if claims.TokenType != jwt.AccessToken {
			response.AuthFail(c)
			c.Abort()
			return
		}
		c.Set("uid", claims.Uid)
		c.Next()
	}
}
