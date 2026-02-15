create table `account` (
    id bigint not null auto_increment,
    uid bigint not null ,
    account varchar(64) not null comment '账号',
    password varchar(128) not null comment '密码',
    primary key (`id`),
    unique key `uk_uid` (`uid`),
    unique key `uk_account` (`account`)
)engine = InnoDB DEFAULT CHARSET = utf8mb4 Collate = utf8mb4_general_ci;