package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"

	_ "mono/gateway/doc/app" // 必须匿名导入生成的 docs 包
	"mono/gateway/grpc"
	"mono/gateway/service/auth"
	nodeService "mono/gateway/service/node"
	"mono/gateway/service/post"
	"mono/gateway/service/user"
	"mono/pkg/middleware"
	authPkg "mono/service/auth/pkg"
	nodePkg "mono/service/node/pkg"
	postPkg "mono/service/post/pkg"
	userPkg "mono/service/user/pkg"
)

func Api(r *gin.Engine, zap *zap.SugaredLogger) {
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	v1.Use(middleware.Log())

	{
		//登录
		conn, err := grpc.GetConn(authPkg.Module)
		if err != nil {
			panic(err)
		}
		service := auth.NewService(conn, zap)

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
		service := post.NewService(conn, zap)

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
		service := user.NewService(conn, zap)

		p := v1.Group("/user")
		p.POST("/batch", service.BatchGetUsersInfo)
		p.POST("/update", service.Update)
	}

	{
		//文件系统
		conn, err := grpc.GetConn(nodePkg.Module)
		if err != nil {
			panic(err)
		}
		service := nodeService.NewService(conn, zap)

		ui := v1.Group("/node")
		ui.Use(middleware.Auth())
		ui.POST("/list", service.ListNodes)
		ui.POST("/create", service.Create)
		ui.POST("/update", service.Update)
		ui.POST("/delete", service.Delete)
	}

	/* 关闭
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
	*/
}
