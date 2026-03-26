package grpc

import (
	"errors"
	"fmt"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	rpcClients = sync.Map{}
)

func RegisterGrpcClient(module, port string) {
	rpc, err := grpc.NewClient(fmt.Sprintf("%s:%s", module, port),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		panic(err)
	}
	rpcClients.Store(module, rpc)
}

func GetConn(module string) (*grpc.ClientConn, error) {
	if conn, ok := rpcClients.Load(module); ok {
		return conn.(*grpc.ClientConn), nil
	}
	return nil, errors.New("not register conn")
}

func CloseAll() {
	rpcClients.Range(func(key, value any) bool {
		_ = value.(*grpc.ClientConn).Close()
		rpcClients.Delete(key)
		return true
	})
}
