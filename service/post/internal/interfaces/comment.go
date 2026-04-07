package interfaces

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"mono/pb/post"
	"mono/service/post/internal/infra/model"
)

func (p *Post) GetPostComment(ctx context.Context, req *post.PostCommentReq) (*post.PostCommentResp, error) {
	res := new(post.PostCommentResp)

	hotCmt := make([]*model.Comment, 0)
	hotIds := make([]int64, 0)
	if req.Cursor == 0 {
		var err error
		hotCmt, err = p.comment.GetHotComment(ctx, req.PostId, 3)
		if err != nil {
			return res, status.Error(codes.Internal, err.Error())
		}
		for _, comment := range hotCmt {
			hotIds = append(hotIds, comment.ID)
		}
	}

	parentCmt := make([]*model.Comment, 0)
	parentIds := make([]int64, 0)
	if len(hotCmt) > 3 {
		parentCmt, err := p.comment.GetParentComment(ctx, req.PostId, req.Cursor, hotIds, int(req.PageSize+1))
		if err != nil {
			return res, status.Error(codes.Internal, err.Error())
		}
		if len(parentCmt) == 0 {
			return res, nil
		}
		if int(req.PageSize) < len(parentCmt) {
			res.HasMore = true
			parentCmt = parentCmt[:req.PageSize]
		}
		for _, comment := range parentCmt {
			parentIds = append(parentIds, comment.ID)
		}
	}

	childCmts, err := p.comment.GetChildrenComment(ctx, append(hotIds, parentIds...))
	if err != nil {
		return res, status.Error(codes.Internal, err.Error())
	}
	childMap := make(map[int64][]*model.Comment)
	for _, child := range childCmts {
		childMap[child.ParentComment] = append(childMap[child.ParentComment], child)
	}

	// 收集所有评论ID，批量查询是否点赞
	allCommentIDs := make([]int64, 0)
	allCommentIDs = append(allCommentIDs, hotIds...)
	allCommentIDs = append(allCommentIDs, parentIds...)
	for _, child := range childCmts {
		allCommentIDs = append(allCommentIDs, child.ID)
	}
	likedMap := p.like.BatchIsLiked(ctx, req.Uid, allCommentIDs, 2)

	toParentPB := func(c *model.Comment) *post.ParentComment {
		pc := &post.ParentComment{
			CommentId:  c.ID,
			Uid:        c.UID,
			Content:    c.Content,
			ReplyCount: int64(len(childMap[c.ID])),
			CreatedAt:  c.CreatedAt.Unix(),
			IsLiked:    likedMap[c.ID],
		}
		for _, child := range childMap[c.ID] {
			pc.ChildrenComment = append(pc.ChildrenComment, &post.ChildrenComment{
				CommentId: child.ID,
				Uid:       child.UID,
				ReplyUid:  child.ReplyUID,
				Content:   child.Content,
				CreatedAt: child.CreatedAt.Unix(),
				IsLiked:   likedMap[child.ID],
			})
		}
		return pc
	}

	for _, c := range hotCmt {
		res.ParentComment = append(res.ParentComment, toParentPB(c))
	}
	for _, c := range parentCmt {
		res.ParentComment = append(res.ParentComment, toParentPB(c))
	}
	return res, nil
}

func (p *Post) SetComment(ctx context.Context, req *post.SetCommentReq) (*emptypb.Empty, error) {
	err := p.comment.CreateComment(ctx, req.PostId, req.Uid, req.Content, req.ParentId, req.ReplyUid)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &emptypb.Empty{}, nil
}

func (p *Post) SetLikeComment(ctx context.Context, req *post.SetLikeReq) (*emptypb.Empty, error) {
	_, err := p.like.ToggleLike(ctx, req.Uid, req.TargetId, int16(req.TargetType))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &emptypb.Empty{}, nil
}
