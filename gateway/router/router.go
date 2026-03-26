package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "mono/gateway/doc/app" // 必须匿名导入生成的 docs 包
	"mono/gateway/service/auth"
	"mono/gateway/service/post"
	"mono/pkg/middleware"
)

func Api(r *gin.Engine) {
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")

	{
		//登录
		acc := v1.Group("/account").Use()
		acc.POST("/register", auth.Register)
		acc.POST("/login", auth.Login)
		acc.POST("/refresh", auth.Refresh)
	}

	{
		//帖子
		p := v1.Group("/post")
		p.POST("/list", post.List)
		p.POST("/create", post.Create).Use(middleware.Auth())
		p.POST("/detail", post.Detail)
	}
}
