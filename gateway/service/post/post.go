package post

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"mono/gateway/ecode"
	"mono/gateway/response"
	"mono/gateway/service"
	"mono/pb/post"
)

type Service struct {
	post        post.PostClient
	sugarLogger *zap.SugaredLogger
}

func NewService(conn *grpc.ClientConn, sugarLogger *zap.SugaredLogger) *Service {
	return &Service{
		post:        post.NewPostClient(conn),
		sugarLogger: sugarLogger,
	}
}

// List 帖子列表
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Param        request  body  ListReq  true  "列表请求"
// @Router       /api/v1/post/list [post]
func (s *Service) List(c *gin.Context) {
	req := new(ListReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	if _, ok := post.SortType_name[req.Sort]; !ok {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.List(c, &post.PostListReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		PostType: req.PostType,
		Sort:     post.SortType(req.Sort),
		Uid:      service.GetUserID(c),
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Create 创建帖子
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  CreateReq  true  "创建请求"
// @Router       /api/v1/post/create [post]
func (s *Service) Create(c *gin.Context) {
	req := new(CreateReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.Create(c, &post.PostCreateReq{
		Uid:      service.GetUserID(c),
		Title:    req.Title,
		Content:  req.Content,
		PostType: req.PostType,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Detail 帖子详情
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Param        request  body  DetailReq  true  "详情请求"
// @Router       /api/v1/post/detail [post]
func (s *Service) Detail(c *gin.Context) {
	req := new(DetailReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.Detail(c, &post.PostDetailReq{
		PostId: req.PostId,
		Uid:    service.GetUserID(c),
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Comment 帖子评论列表
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Param        request  body  CommentReq  true  "评论"
// @Router       /api/v1/post/comment [post]
func (s *Service) Comment(c *gin.Context) {
	req := new(CommentReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.GetPostComment(c, &post.PostCommentReq{
		PostId:   req.PostId,
		Cursor:   req.Cursor,
		PageSize: req.PageSize,
		Uid:      service.GetUserID(c),
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// SetComment 发表评论
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  SetCommentReq  true  "评论请求"
// @Router       /api/v1/post/comment/create [post]
func (s *Service) SetComment(c *gin.Context) {
	req := new(SetCommentReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.SetComment(c, &post.SetCommentReq{
		PostId:   req.PostId,
		Uid:      service.GetUserID(c),
		Content:  req.Content,
		ParentId: req.ParentId,
		ReplyUid: req.ReplyUid,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Like 点赞/取消点赞
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  LikeReq  true  "点赞请求"
// @Router       /api/v1/post/like [post]
func (s *Service) Like(c *gin.Context) {
	req := new(LikeReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.SetLikeComment(c, &post.SetLikeReq{
		TargetId:   req.TargetId,
		TargetType: req.TargetType,
		Uid:        service.GetUserID(c),
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}
