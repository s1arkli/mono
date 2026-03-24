package cmd

import (
	"fmt"
	"log"
	"net"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"

	"mono/gateway/initial"
	"mono/pb"
	"mono/pkg/dbc"
	"mono/service/post/internal/interfaces"
)

func init() {
	rootCmd.AddCommand(authCmd)
}

var authCmd = &cobra.Command{
	Use:   "rpc",
	Short: "Post application",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper("service/post/config.yaml")
		dbc.InitPgsql()

		db := dbc.GetDB()
		lis, err := net.Listen("tcp", fmt.Sprintf(":%s", viper.GetString("port")))
		if err != nil {
			log.Fatal(err)
		}

		s := grpc.NewServer()

		// 这一步是必须的：把你的实现注册到 gRPC Server
		pb.RegisterPostServer(s, &interfaces.Post{
			DB: db,
		})

		log.Println("grpc server listening on :9090")
		if err := s.Serve(lis); err != nil {
			log.Fatal(err)
		}
	},
}
