CREATE DATABASE post;
CREATE DATABASE "user";

-- ======== auth ========
CREATE TABLE IF NOT EXISTS account (
    id       BIGSERIAL    PRIMARY KEY,
    uid      BIGINT       NOT NULL UNIQUE,
    account  VARCHAR(64)  NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uid ON account(uid);
COMMENT ON COLUMN account.uid      IS '用户唯一标识';
COMMENT ON COLUMN account.account  IS '账号';
COMMENT ON COLUMN account.password IS '密码';

-- ======== post ========
\c post
CREATE TABLE IF NOT EXISTS post (
    id            BIGSERIAL    PRIMARY KEY,
    uid           BIGINT       NOT NULL,
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    is_topped     BOOLEAN      NOT NULL DEFAULT false,
    is_draft      BOOLEAN      NOT NULL DEFAULT false,
    post_type     SMALLINT     NOT NULL DEFAULT 1, -- 1=技术，2=生活，3=分享

    top_comment BIGINT DEFAULT 0, -- 指定评论，0=未置顶

    like_count    INTEGER      NOT NULL DEFAULT 0,
    comment_count INTEGER      NOT NULL DEFAULT 0,
    collect_count INTEGER      NOT NULL DEFAULT 0,
    view_count    INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_uid        ON post(uid);
CREATE INDEX IF NOT EXISTS idx_created_at ON post(created_at DESC) WHERE deleted_at IS NULL;

-- ======== comment ========

CREATE TABLE IF NOT EXISTS comment (
    id BIGSERIAL PRIMARY KEY,
    uid BIGINT NOT NULL,
    content TEXT NOT NULL ,

    root_post BIGINT NOT NULL ,
    parent_comment BIGINT NOT NULL DEFAULT 0, -- 0表示一级评论
    reply_uid BIGINT NOT NULL DEFAULT 0,-- 0表示未@，评论主体为一级评论

    like_count BIGINT NOT NULL DEFAULT 0,-- 点赞数量

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
-- 拉取某条帖子下的一级评论
CREATE INDEX IF NOT EXISTS idx_parent_comment ON comment(root_post,created_at DESC )
WHERE parent_comment = 0 AND deleted_at IS NULL;

-- 拉取某个评论下的二级回复
CREATE INDEX IF NOT EXISTS idx_children_comment ON comment(parent_comment,created_at ASC )
WHERE deleted_at IS NULL;

-- 拉取某个用户的评论历史
CREATE INDEX IF NOT EXISTS idx_user_comment ON comment(uid,created_at DESC )
WHERE deleted_at IS NULL;

-- ======== like_post_comment ========
CREATE TABLE IF NOT EXISTS "like" (
    uid BIGINT NOT NULL,
    target_id BIGINT NOT NULL, -- 对应类型的id
    target_type SMALLINT NOT NULL, -- 1=帖子，2=评论
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (uid,target_id,target_type)
);
CREATE INDEX IF NOT EXISTS idx_target ON "like"(target_id,target_type);

-- ======== user ========
\c user
CREATE TABLE IF NOT EXISTS "user" (
    uid        BIGINT      NOT NULL,
    nickname   VARCHAR(64) NOT NULL,
    avatar     TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_uid ON "user"(uid);

\c node
CREATE TABLE IF NOT EXISTS node (
    id BIGSERIAL PRIMARY KEY ,
    uid BIGINT NOT NULL ,
    type int NOT NULL DEFAULT 2,-- 1= folder 2= note
    parent_id BIGINT REFERENCES node(id), -- 代表此字段的值只能是file表里的id的某个值。也对应上了语义。
    title varchar(64) NOT NULL , -- folder name & note title
    content TEXT NOT NULL DEFAULT '',
    path varchar(1000) NOT NULL ,-- 使用id做路径，保证唯一性
    sort int NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_node ON node(uid,parent_id);
CREATE INDEX idx_node_uid_path ON node(uid, path varchar_pattern_ops) WHERE deleted_at IS NULL;
COMMENT ON COLUMN node.type IS '1= folder 2= note';