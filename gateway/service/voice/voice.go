package voice

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

	"mono/gateway/ecode"
	"mono/gateway/response"
	"mono/pkg/jwt"
)

type Service struct {
}

func NewService() *Service {
	return &Service{}
}

func (s *Service) JoinChatRoom(c *gin.Context) {
	// 这个接口不挂任何鉴权中间件

	var req struct {
		RoomID   string `json:"room_id"`
		Identity string `json:"identity"` // 前端传过来的随机 ID
	}
	if err := c.ShouldBind(&req); err != nil {
		response.Fail(c, ecode.ParamErr)
		return
	}

	token, err := jwt.GenerateLiveKitToken(viper.GetString("voice.apiKey"), viper.GetString("voice.api_secret"), req.RoomID, req.Identity)
	if err != nil {
		response.Fail(c, ecode.SystemErr)
		return
	}
	response.Success(c, token)
}
