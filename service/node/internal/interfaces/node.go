package interfaces

import (
	"context"
	"fmt"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"mono/pb/node"
	"mono/service/node/internal/infra"
	"mono/service/node/internal/infra/model"
	"mono/service/node/internal/interfaces/trans"
)

type Node struct {
	node.UnimplementedNodeServer
	Node *infra.Node
}

func NewNode(node *infra.Node) *Node {
	return &Node{
		Node: node,
	}
}

func (n *Node) ListNode(ctx context.Context, req *node.ListNodeReq) (*node.ListNodeResp, error) {
	nodes, err := n.Node.ListNodes(ctx, req.Uid, req.ParentId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return trans.ModelsToGRpc(nodes), nil
}

// CreateNode 先查父节点path，父节点下的sort。插入，查出插入ID，拼接path、sort更新。
func (n *Node) CreateNode(ctx context.Context, req *node.CreateReq) (*emptypb.Empty, error) {
	if err := n.Node.Transaction(ctx, func(ctx context.Context, node *infra.Node) error {
		path := ""
		if req.ParentId != nil && *req.ParentId != 0 {
			parent, err := node.GetNode(ctx, req.Uid, *req.ParentId)
			if err != nil {
				return err
			}
			path = parent.Path
		}

		sort, err := node.GetSort(ctx, req.Uid, req.ParentId)
		if err != nil {
			return err
		}

		newNode := &model.Node{
			UID:      req.Uid,
			Type:     int32(req.Type),
			ParentID: req.ParentId,
			Title:    req.Title,
			Content:  req.Content,
			Sort:     int32(sort),
		}
		if err = node.Create(ctx, newNode); err != nil {
			return err
		}

		if err = node.UpdatePath(ctx, &model.Node{
			ID:   newNode.ID,
			Path: path + "/" + fmt.Sprint(newNode.ID),
		}); err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &emptypb.Empty{}, nil
}
