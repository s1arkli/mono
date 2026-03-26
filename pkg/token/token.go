package token

import "github.com/gin-gonic/gin"

func GetUserID(c *gin.Context) int64 {
	return c.GetInt64("uid")
}
