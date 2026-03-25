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