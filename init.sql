CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,
    uid BIGINT NOT NULL UNIQUE,
    account VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL
);
create index idx_uid on account(uid);
COMMENT ON COLUMN account.uid IS '用户唯一标识';
COMMENT ON COLUMN account.account IS '账号';
COMMENT ON COLUMN account.password IS '密码';


create table post (
                      id BIGSERIAL PRIMARY KEY,
                      uid bigint not null,

                      title varchar(200) not null,
                      content text not null,
                      is_topped boolean not null default false,
                      is_draft boolean not null default false,
                      post_type smallint not null default 1,-- 1=技术，2=生活，3=分享

                      like_count int not null default 0,
                      comment_count int not null default 0,
                      collect_count int not null default 0,
                      view_count int not null default 0,

                      created_at timestamptz not null default now(),
                      updated_at timestamptz not null default now(),
                      deleted_at timestamptz
);
create index idx_uid on post(uid);
create index idx_created_at on post(created_at desc)
    where deleted_at is null;

create table "user" (
                        uid bigint not null,
                        nickname varchar(64) not null,
                        avatar text not null,

                        created_at timestamptz not null default now(),
                        updated_at timestamptz not null default now(),
                        deleted_at timestamptz
);
create index idx_uid on "user"(uid);