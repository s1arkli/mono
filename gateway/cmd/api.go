package cmd

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"mono/gateway/grpc"
	"mono/gateway/router"
	"mono/pkg/initial"
)

func init() {
	rootCmd.AddCommand(apiCmd)
}

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "api",
	Run: func(cmd *cobra.Command, args []string) {
		r := gin.Default()

		initial.Viper("gateway")
		//initial.Minio()

		err := initial.Zap(viper.GetString("env"))
		if err != nil {
			panic("zap init error")
		}

		grpc.RegisterGrpcClient("auth", viper.GetString("service.auth.grpc"), viper.GetString("service.auth.port"))
		grpc.RegisterGrpcClient("user", viper.GetString("service.user.grpc"), viper.GetString("service.user.port"))
		grpc.RegisterGrpcClient("post", viper.GetString("service.post.grpc"), viper.GetString("service.post.port"))
		grpc.RegisterGrpcClient("node", viper.GetString("service.node.grpc"), viper.GetString("service.node.port"))

		zap := initial.GetLogger()
		defer zap.Sync()
		
		router.Api(r, zap)

		port := viper.GetString("api.port")
		_ = r.Run(fmt.Sprintf(":%s", port))
	},
}
