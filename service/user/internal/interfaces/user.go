package interfaces

import (
	"context"

	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"gorm.io/gorm"

	"mono/pb/user"
	"mono/service/user/internal/infra"
	"mono/service/user/internal/infra/model"
	"mono/service/user/pkg"
)

type User struct {
	user.UnimplementedUserServer
	DB *gorm.DB
}

func NewUser(db *gorm.DB) *User {
	return &User{
		DB: db,
	}
}

func (u *User) GetUserInfo(ctx context.Context, req *user.GetUserReq) (*user.GetUserResp, error) {
	data, err := infra.GetUserInfo(u.DB, ctx, req.Uid)
	if err != nil {
		return nil, status.Error(1, err.Error())
	}
	if data == nil {
		return &user.GetUserResp{}, nil
	}
	return &user.GetUserResp{
		Uid:      data.UID,
		Nickname: data.Nickname,
		Avatar:   data.Avatar,
	}, nil
}

func (u *User) BatchGetUserInfo(ctx context.Context, req *user.BatchGetUserReq) (*user.BatchGetUserResp, error) {
	if len(req.Uids) == 0 {
		return &user.BatchGetUserResp{}, nil
	}
	req.Uids = pkg.Unique(req.Uids)

	data, err := infra.BatchGetUserInfo(u.DB, ctx, req.Uids)
	if err != nil {
		return nil, status.Error(1, err.Error())
	}
	if data == nil {
		return &user.BatchGetUserResp{}, nil
	}

	res := make(map[int64]*user.GetUserResp)
	for _, v := range data {
		res[v.UID] = &user.GetUserResp{
			Uid:      v.UID,
			Nickname: v.Nickname,
			Avatar:   v.Avatar,
		}
	}
	return &user.BatchGetUserResp{
		Users: res,
	}, nil
}

func (u *User) UpdateUser(ctx context.Context, req *user.UpdateUserReq) (*emptypb.Empty, error) {
	err := infra.UpdateUser(u.DB, ctx, &model.User{
		UID:      req.Uid,
		Nickname: req.Nickname,
		Avatar:   req.Avatar,
	})
	if err != nil {
		return &emptypb.Empty{}, status.Error(1, err.Error())
	}
	return &emptypb.Empty{}, nil
}

func (u *User) CreateUser(ctx context.Context, req *user.CreateUserReq) (*emptypb.Empty, error) {
	data, err := infra.GetUserInfo(u.DB, ctx, req.Uid)
	if err != nil {
		return &emptypb.Empty{}, status.Error(1, err.Error())
	}
	if data != nil {
		return &emptypb.Empty{}, status.Error(2, "user already exists")
	}

	if err = infra.CreateUser(u.DB, ctx, &model.User{
		UID:      req.Uid,
		Nickname: req.Nickname,
		Avatar:   req.Avatar,
	}); err != nil {
		return &emptypb.Empty{}, status.Error(1, err.Error())
	}
	return &emptypb.Empty{}, nil
}
