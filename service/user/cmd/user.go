package cmd

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/grpc"

	"mono/pb"
	"mono/pkg/initial"
	"mono/service/user/internal/interfaces"
	"mono/service/user/pkg"
)

func init() {
	rootCmd.AddCommand(userCmd)
}

var userCmd = &cobra.Command{
	Use:   "rpc",
	Short: "rpc",
	Run: func(cmd *cobra.Command, args []string) {
		initial.Viper(pkg.Module)
		initial.Postgres()

		db := initial.GetDB()
		defer initial.CloseDB()

		port := viper.GetString("service.user.port")
		listen, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		s := grpc.NewServer()

		pb.RegisterUserServer(s, interfaces.NewUser(db))

		log.Printf("grpc server listening on :%s", port)
		if err := s.Serve(listen); err != nil {
			log.Fatal(err)
		}
	},
}
