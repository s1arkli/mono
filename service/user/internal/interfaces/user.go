package interfaces

import (
	"context"

	"gorm.io/gorm"

	"mono/pb"
	"mono/service/user/internal/infra"
	"mono/service/user/pkg"
)

type User struct {
	pb.UnimplementedUserServer
	DB *gorm.DB
}

func NewUser(db *gorm.DB) *User {
	return &User{
		DB: db,
	}
}

func (u *User) GetUserInfo(ctx context.Context, req *pb.GetUserReq) (*pb.GetUserResp, error) {
	data, err := infra.GetUserInfo(u.DB, ctx, req.Uid)
	if err != nil {
		return nil, err
	}
	if data == nil {
		return &pb.GetUserResp{}, nil
	}
	return &pb.GetUserResp{
		Uid:      data.UID,
		Nickname: data.Nickname,
		Avatar:   data.Avatar,
	}, nil
}

func (u *User) BatchGetUserInfo(ctx context.Context, req *pb.BatchGetUserReq) (*pb.BatchGetUserResp, error) {
	if len(req.Uids) == 0 {
		return &pb.BatchGetUserResp{}, nil
	}
	req.Uids = pkg.Unique(req.Uids)

	data, err := infra.BatchGetUserInfo(u.DB, ctx, req.Uids)
	if err != nil {
		return nil, err
	}
	if data == nil {
		return &pb.BatchGetUserResp{}, nil
	}

	res := make(map[int64]*pb.GetUserResp)
	for _, v := range data {
		res[v.UID] = &pb.GetUserResp{
			Uid:      v.UID,
			Nickname: v.Nickname,
			Avatar:   v.Avatar,
		}
	}
	return &pb.BatchGetUserResp{
		Users: res,
	}, nil
}
