package node

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"mono/gateway/ecode"
	"mono/gateway/response"
	"mono/gateway/service"
	"mono/pb/node"
)

type Service struct {
	node        node.NodeClient
	sugarLogger *zap.SugaredLogger
}

func NewService(conn *grpc.ClientConn, sugarLogger *zap.SugaredLogger) *Service {
	return &Service{
		node:        node.NewNodeClient(conn),
		sugarLogger: sugarLogger,
	}
}

// ListNodes 获取节点列表
// @Summary
// @Description
// @Tags         node
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  ListNodesReq  true  "节点列表请求"
// @Router       /api/v1/node/list [post]
func (s *Service) ListNodes(c *gin.Context) {
	param := new(ListNodesReq)
	if err := c.ShouldBind(param); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}
	data, err := s.node.ListNode(c, &node.ListNodeReq{
		Uid:      service.GetUserID(c),
		ParentId: param.ParentID,
	})

	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, data)
}

// Create 创建文件夹或笔记
// @Summary
// @Description
// @Tags         node
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  CreateReq  true  "创建节点请求"
// @Router       /api/v1/node/create [post]
func (s *Service) Create(c *gin.Context) {
	req := new(CreateReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.node.CreateNode(c, &node.CreateReq{
		Uid:      service.GetUserID(c),
		Type:     node.NodeType(req.Type),
		ParentId: req.ParentID,
		Title:    req.Title,
		Content:  req.Content,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Update 更新文件夹或笔记
// @Summary
// @Description
// @Tags         node
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  UpdateReq  true  "更新节点请求"
// @Router       /api/v1/node/update [post]
func (s *Service) Update(c *gin.Context) {
	req := new(UpdateReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.node.UpdateNode(c, &node.UpdateReq{
		Uid:     service.GetUserID(c),
		Id:      req.Id,
		Title:   req.Title,
		Content: req.Content,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}

// Delete 删除节点
// @Summary
// @Description
// @Tags         node
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body  DeleteReq  true  "删除节点请求"
// @Router       /api/v1/node/delete [post]
func (s *Service) Delete(c *gin.Context) {
	req := new(DeleteReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.node.DeleteNode(c, &node.DeleteReq{
		Uid: service.GetUserID(c),
		Id:  req.Id,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, resp)
}
