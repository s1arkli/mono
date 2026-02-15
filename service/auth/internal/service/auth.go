package service

import (
	"context"

	authpb "auth/pb"
)

type AuthService struct {
	authpb.UnimplementedAuthServiceServer
}

func (a *AuthService) Login(ctx context.Context) {}

func (a *AuthService) GetToken(ctx context.Context, loginReq *authpb.LoginReq) (*authpb.LoginResp, error) {
	return nil, nil
}

func (a *AuthService) RefreshToken(ctx context.Context) {
}
