package client

import (
	"fmt"

	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"mono/pb"
)

func InitUserClient() pb.UserClient {
	conn, err := grpc.NewClient(
		fmt.Sprintf("%s:%s", viper.GetString("service.user.grpc"), viper.GetString("service.user.port")),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		panic(err)
	}
	return pb.NewUserClient(conn)
}
