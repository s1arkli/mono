package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
)

type Claims struct {
	Uid       int64     `json:"uid"`
	TokenType TokenType `json:"tokenType"`
	jwt.RegisteredClaims
}

type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

func GenerateToken(uid int64, ttl time.Duration, tokenType TokenType) (string, error) {
	claims := Claims{
		Uid: uid,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		TokenType: tokenType,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(viper.GetString("jwt.secret_key")))
}

// 验证
func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(viper.GetString("jwt.secret_key")), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

// 语音平台

type LiveKitClaims struct {
	Video *VideoGrant `json:"video"`
	jwt.RegisteredClaims
}

type VideoGrant struct {
	RoomJoin bool   `json:"roomJoin"`
	Room     string `json:"room"`
}

func GenerateLiveKitToken(apiKey, apiSecret, room, identity string) (string, error) {
	claims := LiveKitClaims{
		Video: &VideoGrant{
			RoomJoin: true,
			Room:     room,
		},
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    apiKey,
			Subject:   identity,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(6 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(apiSecret))
}
