package infra

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gen/field"
	"gorm.io/gorm"

	"mono/service/node/internal/infra/dal"
	"mono/service/node/internal/infra/model"
)

type Node struct {
	db *gorm.DB
}

func NewNode(db *gorm.DB) *Node {
	return &Node{
		db: db,
	}
}

func (n *Node) Transaction(ctx context.Context, f func(ctx context.Context, node *Node) error) error {
	return n.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		node := NewNode(tx)
		return f(ctx, node)
	})
}

func (n *Node) ListNodes(ctx context.Context, uid int64, parentID *int64) ([]*model.Node, error) {
	nDal := dal.Use(n.db).Node
	query := nDal.WithContext(ctx).Where(nDal.UID.Eq(uid))

	if parentID != nil {
		query = query.Where(nDal.ParentID.Eq(*parentID))
	} else {
		query = query.Where(nDal.ParentID.IsNull())
	}

	return query.Find()
}

func (n *Node) GetNode(ctx context.Context, uid, id int64) (*model.Node, error) {
	nDal := dal.Use(n.db).Node
	data, err := nDal.WithContext(ctx).Where(nDal.UID.Eq(uid), nDal.ID.Eq(id)).First()
	if err != nil && !errors.Is(gorm.ErrRecordNotFound, err) {
		return nil, err
	}
	return data, nil
}

func (n *Node) GetSort(ctx context.Context, uid int64, parentID *int64) (int, error) {
	nDal := dal.Use(n.db).Node
	query := nDal.WithContext(ctx).Where(nDal.UID.Eq(uid))

	if parentID != nil {
		query = query.Where(nDal.ParentID.Eq(*parentID))
	} else {
		query = query.Where(nDal.ParentID.IsNull())
	}

	sort := 0
	err := query.Order(nDal.Sort.Desc()).Select(nDal.Sort).Scan(&sort)
	if err != nil && !errors.Is(gorm.ErrRecordNotFound, err) {
		return 0, err
	}
	return sort + 1, nil
}

func (n *Node) Create(ctx context.Context, node *model.Node) error {
	nDal := dal.Use(n.db).Node
	return nDal.WithContext(ctx).Create(node)
}

func (n *Node) UpdatePath(ctx context.Context, node *model.Node) error {
	nDal := dal.Use(n.db).Node
	_, err := nDal.WithContext(ctx).Where(nDal.ID.Eq(node.ID)).Update(nDal.Path, node.Path)
	return err
}

func (n *Node) Update(ctx context.Context, node *model.Node) error {
	nDal := dal.Use(n.db).Node

	res, err := nDal.WithContext(ctx).
		Where(nDal.UID.Eq(node.UID), nDal.ID.Eq(node.ID)).
		UpdateSimple(
			nDal.Title.Value(node.Title),
			nDal.Content.Value(node.Content),
		)
	if err != nil {
		return err
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("node not found: uid=%d id=%d", node.UID, node.ID)
	}
	return nil
}

func (n *Node) Delete(ctx context.Context, uid, id int64) error {
	data, err := n.GetNode(ctx, uid, id)
	if err != nil {
		return err
	}
	if data == nil {
		return fmt.Errorf("node not found: uid=%d id=%d", uid, id)
	}

	nDal := dal.Use(n.db).Node
	_, err = nDal.WithContext(ctx).
		Where(
			nDal.UID.Eq(uid),
			field.Or(
				nDal.ID.Eq(id),
				nDal.Path.Like(data.Path+"/%"),
			),
		).
		Delete()
	return err
}
