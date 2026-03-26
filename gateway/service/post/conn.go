package post

import (
	"fmt"

	"github.com/spf13/viper"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	conn *grpc.ClientConn
)

func initPostConn() {
	postConn, err := grpc.NewClient(fmt.Sprintf("%s:%s", viper.GetString("service.post.grpc"), viper.GetString("service.post.port")),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		panic(err)
	}
	conn = postConn
}

func GetConn() *grpc.ClientConn {
	return conn
}

func CloseConn() {
	if conn != nil {
		conn.Close()
	}
}
