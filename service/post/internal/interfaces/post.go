package interfaces

import (
	"context"

	"google.golang.org/protobuf/types/known/emptypb"
	"gorm.io/gorm"

	"mono/pb"
	"mono/service/post/internal/infra"
)

type Post struct {
	pb.UnimplementedPostServer
	db         *gorm.DB
	userClient pb.UserClient
}

func NewPost(db *gorm.DB, user pb.UserClient) *Post {
	return &Post{
		db:         db,
		userClient: user,
	}
}

func (p *Post) List(ctx context.Context, req *pb.PostListReq) (*pb.PostListResp, error) {
	errRes := &pb.PostListResp{}

	data, total, err := infra.List(p.db, ctx, req)
	if err != nil {
		return errRes, err
	}
	if len(data) == 0 {
		return errRes, nil
	}
	resp, uids := postModelsToPB(data, total)
	userMap, err := p.userClient.BatchGetUserInfo(ctx, &pb.BatchGetUserReq{Uids: uids})
	if err == nil {
		appendUserInfo(resp, userMap.Users)
	}
	return resp, nil
}

func (p *Post) Create(ctx context.Context, req *pb.PostCreateReq) (*emptypb.Empty, error) {
	return &emptypb.Empty{}, infra.Create(p.db, ctx, req)
}

func (p *Post) Detail(ctx context.Context, req *pb.PostDetailReq) (*pb.PostDetailResp, error) {
	data, err := infra.Detail(p.db, ctx, req)
	if err != nil {
		return nil, err
	}
	res := &pb.PostDetailResp{
		Title:        data.Title,
		Content:      data.Content,
		Uid:          data.UID,
		Avatar:       "",
		Nickname:     "",
		LikeCount:    data.LikeCount,
		CollectCount: data.CollectCount,
		ViewCount:    data.ViewCount,
	}

	user, err := p.userClient.GetUserInfo(ctx, &pb.GetUserReq{Uid: data.UID})
	if err == nil {
		res.Avatar = user.Avatar
		res.Nickname = user.Nickname
	}
	return res, nil
}
