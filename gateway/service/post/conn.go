package post

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	conn *grpc.ClientConn
)

func initPostConn() {
	postConn, err := grpc.NewClient("localhost:9910",
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
