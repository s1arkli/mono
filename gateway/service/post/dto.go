package post

type (
	ListReq struct {
		Page     int32 `json:"page" binding:"required,min=1,max=200"`
		PageSize int32 `json:"pageSize" binding:"required,min=5,max=150"`
		PostType int32 `json:"postType" binding:"oneof=0 1 2 3"`
		Sort     int32 `json:"sort" binding:"oneof=0 1 2"`
	}

	ListResp struct {
		Posts []*ListItem `json:"posts"`
		Total int32       `json:"total"`
	}

	ListItem struct {
		Title        string `json:"title"`
		Summary      string `json:"summary"`
		PostId       int64  `json:"postId"`
		Uid          int64  `json:"uid"`
		Avatar       string `json:"avatar"`
		Nickname     string `json:"nickname"`
		LikeCount    int32  `json:"likeCount"`
		CollectCount int32  `json:"collectCount"`
		CommentCount int32  `json:"commentCount"`
		ViewCount    int32  `json:"viewCount"`
		IsTopped     bool   `json:"isTopped"`
		CreatedAt    int64  `json:"createdAt"`
	}

	CreateReq struct {
		Title    string `json:"title" binding:"required,min=1,max=100"`
		Content  string `json:"content" binding:"required,min=1,max=1000"`
		PostType int32  `json:"post_type" binding:"required,oneof=0 1 2 3"`
	}

	DetailReq struct {
		PostId int64 `json:"postId" binding:"required,gt=0"`
	}
)
