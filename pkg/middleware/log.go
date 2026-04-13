package middleware

import (
	"bytes"
	"io"
	"time"

	"github.com/gin-gonic/gin"

	"mono/pkg/initial"
)

func Log() gin.HandlerFunc {
	sugar := initial.GetLogger() // 初始化一次，不要每个请求都拿

	return func(c *gin.Context) {
		start := time.Now()

		// 读 body 并写回
		var reqBody []byte
		if c.Request.Body != nil {
			reqBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(reqBody))
		}

		c.Next()

		// 放在 c.Next() 之后，请求和响应信息都能拿到
		sugar.Infow("http request",
			"method", c.Request.Method,
			"path", c.FullPath(),
			"uri", c.Request.RequestURI,
			"status", c.Writer.Status(),
			"latency", time.Since(start).String(),
			"client_ip", c.ClientIP(),
			"req_body", string(reqBody),
		)
	}
}
