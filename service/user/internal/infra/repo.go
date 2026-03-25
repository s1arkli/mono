package infra

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"mono/service/user/internal/infra/dal"
	"mono/service/user/internal/infra/model"
)

func GetUserInfo(db *gorm.DB, ctx context.Context, uid int64) (*model.User, error) {
	uDal := dal.Use(db).User
	data, err := uDal.WithContext(ctx).Where(uDal.UID.Eq(uid)).First()
	if err != nil {
		return nil, err
	}
	return data, nil
}

func BatchGetUserInfo(db *gorm.DB, ctx context.Context, uids []int64) ([]*model.User, error) {
	uDal := dal.Use(db).User

	data, err := uDal.WithContext(ctx).Where(uDal.UID.In(uids...)).Find()
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return data, nil
}
