package cmd

import (
	"fmt"
	"log"
	"net"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"

	authpb "mono/pb"
	"mono/pkg/initial"
	"mono/service/auth/internal/interfaces"
	"mono/service/auth/pkg"
	"mono/service/auth/pkg/gen"
)

func init() {
	rootCmd.AddCommand(authCmd)
}

var authCmd = &cobra.Command{
	Use:   "rpc",
	Short: "Auth application",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper(pkg.Module)
		gen.InitSnow()
		initial.Postgres()

		db := initial.GetDB()
		defer initial.CloseDB()

		port := viper.GetString("service.token.port")
		lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
		if err != nil {
			log.Fatal(err)
		}

		s := grpc.NewServer()

		// 这一步是必须的：把你的实现注册到 gRPC Server
		authpb.RegisterAuthServiceServer(s, &interfaces.Auth{
			DB: db,
		})

		log.Printf("grpc server listening on :%s", port)
		if err := s.Serve(lis); err != nil {
			log.Fatal(err)
		}
	},
}
