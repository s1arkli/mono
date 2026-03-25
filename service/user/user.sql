create table "user" (
    uid bigint not null,
    nickname varchar(64) not null,
    avatar text not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);
create index idx_uid on "user"(uid);