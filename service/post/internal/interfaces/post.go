package interfaces

import (
	"context"

	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"mono/pb/post"
	"mono/pb/user"
	"mono/service/post/internal/infra"
)

type Post struct {
	post.UnimplementedPostServer
	post    *infra.Post
	comment *infra.Comment
	like    *infra.Like

	userClient user.UserClient
}

func NewPost(post *infra.Post, comment *infra.Comment, like *infra.Like, user user.UserClient) *Post {
	return &Post{
		post:    post,
		comment: comment,
		like:    like,

		userClient: user,
	}
}

func (p *Post) List(ctx context.Context, req *post.PostListReq) (*post.PostListResp, error) {
	errRes := &post.PostListResp{}

	data, total, err := p.post.List(ctx, req)
	if err != nil {
		return errRes, status.Error(1, err.Error())
	}
	if len(data) == 0 {
		return errRes, nil
	}
	resp, uids := postModelsToPB(data, total)
	userMap, err := p.userClient.BatchGetUserInfo(ctx, &user.BatchGetUserReq{Uids: uids})
	if err == nil {
		appendUserInfo(resp, userMap.Users)
	}

	// 设置 is_liked
	if req.Uid > 0 {
		postIDs := make([]int64, 0, len(data))
		for _, v := range data {
			postIDs = append(postIDs, v.ID)
		}
		likedMap := p.like.BatchIsLiked(ctx, req.Uid, postIDs, 1)
		for _, item := range resp.Posts {
			item.IsLiked = likedMap[item.PostId]
		}
	}

	return resp, nil
}

func (p *Post) Create(ctx context.Context, req *post.PostCreateReq) (*emptypb.Empty, error) {
	if err := p.post.Create(ctx, req); err != nil {
		return &emptypb.Empty{}, status.Error(1, err.Error())
	}
	return &emptypb.Empty{}, nil
}

func (p *Post) Detail(ctx context.Context, req *post.PostDetailReq) (*post.PostDetailResp, error) {
	data, err := p.post.Detail(ctx, req)
	if err != nil {
		return nil, status.Error(1, err.Error())
	}
	res := &post.PostDetailResp{
		Title:        data.Title,
		Content:      data.Content,
		Uid:          data.UID,
		Avatar:       "",
		Nickname:     "",
		LikeCount:    data.LikeCount,
		CollectCount: data.CollectCount,
		ViewCount:    data.ViewCount,
	}

	userInfo, err := p.userClient.GetUserInfo(ctx, &user.GetUserReq{Uid: data.UID})
	if err == nil {
		res.Avatar = userInfo.Avatar
		res.Nickname = userInfo.Nickname
	}

	// 设置 is_liked
	if req.Uid > 0 {
		res.IsLiked = p.like.IsLiked(ctx, req.Uid, req.PostId, 1)
	}

	return res, nil
}
