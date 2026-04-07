package user

import (
	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"

	"mono/gateway/ecode"
	"mono/gateway/response"
	"mono/pb/user"
)

type Service struct {
	user user.UserClient
	conn *grpc.ClientConn
}

func NewService(conn *grpc.ClientConn) *Service {
	return &Service{
		user: user.NewUserClient(conn),
		conn: conn,
	}
}

// BatchGetUsersInfo 获取用户信息
// @Summary
// @Description
// @Tags         user
// @Accept       json
// @Produce      json
// @Param        request  body  BatchGetUserInfoReq  true  "批量获取用户信息"
// @Router       /api/v1/user/batch [post]
func (s *Service) BatchGetUsersInfo(c *gin.Context) {
	req := new(BatchGetUserInfoReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	userMap, err := s.user.BatchGetUserInfo(c, &user.BatchGetUserReq{
		Uids: req.Uids,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, userMap)
}

// Update 修改用户信息
// @Summary
// @Description
// @Tags         user
// @Accept       json
// @Produce      json
// @Param        request  body  UpdateUserReq  true  "修改用户信息"
// @Router       /api/v1/user/update [post]
func (s *Service) Update(c *gin.Context) {
	req := new(UpdateUserReq)
	if err := c.ShouldBind(req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	if _, err := s.user.UpdateUser(c, &user.UpdateUserReq{
		Uid:      req.Uid,
		Nickname: req.Nickname,
		Avatar:   req.Avatar,
	}); err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}
	response.Success(c, "ok")
}
