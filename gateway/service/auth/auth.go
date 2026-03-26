package auth

import (
	"github.com/gin-gonic/gin"
	"google.golang.org/grpc"

	authpb "mono/pb"

	"mono/gateway/ecode"
	"mono/gateway/response"
)

type Service struct {
	auth authpb.AuthServiceClient
	conn *grpc.ClientConn
}

func NewService(conn *grpc.ClientConn) *Service {
	return &Service{
		auth: authpb.NewAuthServiceClient(conn),
		conn: conn,
	}
}

// Register 注册
// @Summary
// @Description
// @Tags         account
// @Accept       json
// @Produce      json
// @Param        request  body  RegisterRequest  true  "注册请求"
// @Router       /account/register [post]
func (s *Service) Register(c *gin.Context) {
	req := new(RegisterRequest)

	if err := c.ShouldBind(&req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	_, err := s.auth.Register(c, &authpb.RegisterReq{
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
		return
	}
	response.Success(c, "ok")
}

// Login 登录
// @Summary
// @Description
// @Tags         account
// @Accept       json
// @Produce      json
// @Param        request  body  LoginRequest  true  "注册请求"
// @Router       /account/login [post]
func (s *Service) Login(c *gin.Context) {
	req := new(LoginRequest)

	if err := c.ShouldBind(&req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.auth.Login(c, &authpb.LoginReq{
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		response.Fail(c, ecode.New(1, err.Error()))
		return
	}

	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*3600, "/api/v1/account/refresh", "", true, true)
	response.Success(c, resp.AccessToken)
}

// Refresh 刷新token
// @Summary
// @Description
// @Tags         account
// @Accept       json
// @Produce      json
// @Param        Cookie  header  string  true  "Bearer token"
// @Router       /account/refresh [post]
func (s *Service) Refresh(c *gin.Context) {
	rToken, err := c.Cookie("refresh_token")
	if err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.auth.Refresh(c, &authpb.RefreshReq{
		RefreshToken: rToken,
	})
	if err != nil {
		c.SetCookie("refresh_token", "", -1, "/api/v1/account/refresh", "", true, true)
		response.Fail(c, ecode.New(1, err.Error()))
		return
	}

	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*3600, "/api/v1/account/refresh", "", true, true)

	response.Success(c, resp.AccessToken)
}
