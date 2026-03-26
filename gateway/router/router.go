package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "mono/gateway/doc/app" // 必须匿名导入生成的 docs 包
	"mono/gateway/grpc"
	"mono/gateway/service/auth"
	"mono/gateway/service/post"
	"mono/pkg/middleware"
	authPkg "mono/service/auth/pkg"
	postPkg "mono/service/post/pkg"
)

func Api(r *gin.Engine) {
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")

	{
		//登录
		conn, err := grpc.GetConn(authPkg.Module)
		if err != nil {
			panic(err)
		}
		service := auth.NewService(conn)

		acc := v1.Group("/account").Use()
		acc.POST("/register", service.Register)
		acc.POST("/login", service.Login)
		acc.POST("/refresh", service.Refresh)
	}

	{
		//帖子
		conn, err := grpc.GetConn(postPkg.Module)
		if err != nil {
			panic(err)
		}
		service := post.NewService(conn)

		p := v1.Group("/post")
		p.POST("/list", service.List)
		p.POST("/create", service.Create).Use(middleware.Auth())
		p.POST("/detail", service.Detail)
	}
}
