package cmd

import (
	"fmt"
	"log"
	"net"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"

	"mono/pb/post"
	"mono/pkg/initial"
	"mono/service/post/internal/client"
	"mono/service/post/internal/infra"
	"mono/service/post/internal/interfaces"
	"mono/service/post/pkg"
)

func init() {
	rootCmd.AddCommand(authCmd)
}

var authCmd = &cobra.Command{
	Use:   "rpc",
	Short: "Post application",
	Run: func(cmd *cobra.Command, args []string) {
		//viper,db初始化
		initial.Viper(pkg.Module)
		initial.Postgres()

		//rpc client初始化
		user := client.InitUserClient()

		db := initial.GetDB()
		defer initial.CloseDB()
		port := viper.GetString("service.post.port")

		lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
		if err != nil {
			log.Fatal(err)
		}

		s := grpc.NewServer()

		// 业务逻辑注册到 gRPC Server
		postDB := infra.NewPost(db)
		comment := infra.NewComment(db)
		like := infra.NewLike(db)

		post.RegisterPostServer(s, interfaces.NewPost(postDB, comment, like, user))

		log.Printf("grpc server listening on :%s", port)
		if err := s.Serve(lis); err != nil {
			log.Fatal(err)
		}
	},
}
