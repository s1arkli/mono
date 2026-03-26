package auth

import (
	"fmt"

	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	conn *grpc.ClientConn
)

func initAuthConn() {
	authConn, err := grpc.NewClient(fmt.Sprintf("%s:%s", viper.GetString("service.token.grpc"), viper.GetString("service.token.port")),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		panic(err)
	}
	conn = authConn
}

func GetGrpcConn() *grpc.ClientConn {
	return conn
}

func Close() {
	if conn != nil {
		_ = conn.Close()
	}
}
