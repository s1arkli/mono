package post

import (
	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"

	"mono/gateway/ecode"
	"mono/gateway/response"
	"mono/pb"
	"mono/pkg/token"
)

type Service struct {
	post pb.PostClient
	conn *grpc.ClientConn
}

func NewService(conn *grpc.ClientConn) *Service {
	return &Service{
		post: pb.NewPostClient(conn),
		conn: conn,
	}
}

// List 帖子列表
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Param        request  body  ListReq  true  "列表请求"
// @Router       /post/list [post]
func (s *Service) List(c *gin.Context) {
	req := new(ListReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.List(c, &pb.PostListReq{
		Page:     req.Page,
		PageSize: req.PageSize,
		PostType: req.PostType,
		Sort:     pb.SortType(req.Sort),
	})
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
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
// @Router       /post/create [post]
func (s *Service) Create(c *gin.Context) {
	req := new(CreateReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.Create(c, &pb.PostCreateReq{
		Uid:      token.GetUserID(c),
		Title:    req.Title,
		Content:  req.Content,
		PostType: req.PostType,
	})
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
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
// @Router       /post/detail [post]
func (s *Service) Detail(c *gin.Context) {
	req := new(DetailReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.post.Detail(c, &pb.PostDetailReq{
		PostId: req.PostId,
	})
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
		return
	}
	response.Success(c, resp)
}
