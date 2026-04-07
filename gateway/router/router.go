package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "mono/gateway/doc/app" // 必须匿名导入生成的 docs 包
	"mono/gateway/grpc"
	"mono/gateway/service/auth"
	"mono/gateway/service/post"
	"mono/gateway/service/resource"
	"mono/gateway/service/user"
	"mono/gateway/service/voice"
	"mono/pkg/middleware"
	authPkg "mono/service/auth/pkg"
	postPkg "mono/service/post/pkg"
	userPkg "mono/service/user/pkg"
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
		p.POST("/detail", service.Detail)
		p.POST("/comment", service.Comment)

		p.Use(middleware.Auth())
		p.POST("/comment/create", service.SetComment)
		p.POST("/like", service.Like)
		p.POST("/create", service.Create)
	}

	{
		//用户
		conn, err := grpc.GetConn(userPkg.Module)
		if err != nil {
			panic(err)
		}
		service := user.NewService(conn)

		p := v1.Group("/user")
		p.POST("/batch", service.BatchGetUsersInfo)
		p.POST("/update", service.Update)
	}

	{
		//资源上传
		service := resource.NewService()

		ui := v1.Group("/resource")
		ui.POST("/upload/avatar", service.Avatar)
	}

	{
		//语音
		service := voice.NewService()

		ui := v1.Group("/voice")
		ui.POST("/join", service.JoinChatRoom)
	}
}
