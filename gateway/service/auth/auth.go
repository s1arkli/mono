package auth

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"mono/pb/auth"

	"mono/gateway/ecode"
	"mono/gateway/response"
)

type Service struct {
	auth        auth.AuthServiceClient
	sugarLogger *zap.SugaredLogger
}

func NewService(conn *grpc.ClientConn, sugarLogger *zap.SugaredLogger) *Service {
	return &Service{
		auth:        auth.NewAuthServiceClient(conn),
		sugarLogger: sugarLogger,
	}
}

// Register 注册
// @Summary
// @Description
// @Tags         account
// @Accept       json
// @Produce      json
// @Param        request  body  RegisterRequest  true  "注册请求"
// @Router       /api/v1/account/register [post]
func (s *Service) Register(c *gin.Context) {
	req := new(RegisterRequest)

	if err := c.ShouldBind(&req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	_, err := s.auth.Register(c, &auth.RegisterReq{
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
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
// @Router       /api/v1/account/login [post]
func (s *Service) Login(c *gin.Context) {
	req := new(LoginRequest)

	if err := c.ShouldBind(&req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.auth.Login(c, &auth.LoginReq{
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}

	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*3600, "/api/v1/account/refresh", "", true, true)
	response.Success(c, LoginResp{
		AccessToken: resp.AccessToken,
		Uid:         resp.Uid,
		Nickname:    resp.Nickname,
		Avatar:      resp.Avatar,
	})
}

// Refresh 刷新token
// @Summary
// @Description
// @Tags         account
// @Accept       json
// @Produce      json
// @Param        Cookie  header  string  true  "Bearer token"
// @Router       /api/v1/account/refresh [post]
func (s *Service) Refresh(c *gin.Context) {
	rToken, err := c.Cookie("refresh_token")
	if err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	resp, err := s.auth.Refresh(c, &auth.RefreshReq{
		RefreshToken: rToken,
	})
	if err != nil {
		c.SetCookie("refresh_token", "", -1, "/api/v1/account/refresh", "", true, true)
		_, msg := ecode.FromRpcErr(err)
		response.Fail(c, ecode.New(1, msg))
		return
	}

	c.SetCookie("refresh_token", resp.RefreshToken, 7*24*3600, "/api/v1/account/refresh", "", true, true)

	response.Success(c, resp.AccessToken)
}
