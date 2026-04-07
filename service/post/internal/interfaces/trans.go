package interfaces

import (
	"mono/pb/post"
	"mono/pb/user"
	"mono/service/post/internal/infra/model"
)

func postModelsToPB(data []*model.Post, total int64) (*post.PostListResp, []int64) {
	res := new(post.PostListResp)
	uids := make([]int64, 0)
	if len(data) == 0 {
		return res, uids
	}
	res.Total = total
	for _, v := range data {
		uids = append(uids, v.UID)
		res.Posts = append(res.Posts, &post.PostListItem{
			Title:        v.Title,
			Summary:      getSummary(v.Content, 20),
			PostId:       v.ID,
			Uid:          v.UID,
			Avatar:       "",
			Nickname:     "",
			LikeCount:    v.LikeCount,
			CollectCount: v.CollectCount,
			CommentCount: v.CommentCount,
			ViewCount:    v.ViewCount,
			IsTopped:     false,
			CreatedAt:    v.CreatedAt.Unix(),
		})
	}
	return res, uids
}

func getSummary(content string, n int) string {
	r := []rune(content)
	if len(r) <= n {
		return string(r)
	}
	return string(r[:n]) + "..."
}

func appendUserInfo(data *post.PostListResp, userMap map[int64]*user.GetUserResp) *post.PostListResp {
	if data == nil {
		return data
	}

	for _, v := range data.Posts {
		userInfo, ok := userMap[v.Uid]
		if !ok {
			continue
		}

		v.Avatar = userInfo.Avatar
		v.Nickname = userInfo.Nickname
	}
	return data
}
