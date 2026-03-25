package client

import (
	"fmt"

	"github.com/spf13/viper"
	"google.golang.org/grpc"

	"mono/pb"
)

func InitUserClient() pb.UserClient {
	conn, err := grpc.NewClient(fmt.Sprintf("localhost:%s", viper.GetString("service.user.port")))
	if err != nil {
		panic(err)
	}
	return pb.NewUserClient(conn)
}
