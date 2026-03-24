package post

import (
	"github.com/gin-gonic/gin"

	"mono/gateway/ecode"
	"mono/gateway/response"
	postpb "mono/pb"
)

var (
	postClient postpb.PostClient
)

func InitPostClient() {
	initPostConn()
	postClient = postpb.NewPostClient(GetConn())
}

// List 帖子列表
// @Summary
// @Description
// @Tags         post
// @Accept       json
// @Produce      json
// @Param        request  body  ListReq  true  "列表请求"
// @Router       /post/list [post]
func List(c *gin.Context) {
	req := new(ListReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := postClient.List(c, &postpb.PostListReq{
		Page:       req.Page,
		PageSize:   req.PageSize,
		CategoryId: req.CategoryId,
		Sort:       postpb.SortType(req.Sort),
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
// @Param        request  body  pb.PostCreateReq  true  "创建请求"
// @Router       /post/create [post]
func Create(c *gin.Context) {
	req := new(postpb.PostCreateReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := postClient.Create(c, req)
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
// @Param        request  body  pb.PostDetailReq  true  "详情请求"
// @Router       /post/detail [post]
func Detail(c *gin.Context) {
	req := new(postpb.PostDetailReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := postClient.Detail(c, req)
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
		return
	}
	response.Success(c, resp)
}
