package interfaces

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"gorm.io/gorm"

	postpb "mono/pb"
)

type Post struct {
	postpb.UnimplementedPostServer
	DB *gorm.DB
}

func (p *Post) List(ctx context.Context, req *postpb.PostListReq) (*postpb.PostListResp, error) {
	
	return nil, status.Error(codes.Unimplemented, "method List not implemented")
}

func (p *Post) Create(ctx context.Context, req *postpb.PostCreateReq) (*emptypb.Empty, error) {
	return nil, status.Error(codes.Unimplemented, "method Create not implemented")
}

func (p *Post) Detail(ctx context.Context, req *postpb.PostDetailReq) (*postpb.PostDetailResp, error) {
	return nil, status.Error(codes.Unimplemented, "method Detail not implemented")
}
