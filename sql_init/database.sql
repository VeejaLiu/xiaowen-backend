# If not exist, create database
CREATE DATABASE IF NOT EXISTS xiaowen_ai DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci;

USE xiaowen_ai;

# user table
CREATE TABLE `user`
(
    `id`           bigint       NOT NULL AUTO_INCREMENT,
    `user_id`      varchar(36)           DEFAULT NULL,
    `appid`        varchar(255) NOT NULL DEFAULT '',
    `openid`       varchar(255) NOT NULL DEFAULT '',
    `unionid`      varchar(255) NOT NULL DEFAULT '',
    `session_key`  varchar(255) NOT NULL DEFAULT '',
    `access_token` varchar(255) NOT NULL DEFAULT '',
    `create_time`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;


# generate history table
CREATE TABLE `user_generate_history`
(
    `id`                 bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id`            varchar(36)         DEFAULT NULL COMMENT '用户id',
    `style`              INT        NOT NULL DEFAULT 0 COMMENT '风格',
    `prompt_history_id`  BIGINT     NOT NULL COMMENT 'prompt_history表的id',
    `generate_used_time` INT        NOT NULL DEFAULT 0 COMMENT '生成所用时间,单位毫秒',
    `images`             TEXT       NOT NULL COMMENT '生成的图片objectName, 是个string数组Json',
    `is_private`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否私有',
    `is_stared`          tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否收藏',
    `is_deleted`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    `create_time`        datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`        datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

# prompt history table
CREATE TABLE `prompt_history`
(
    `id`             bigint(20) NOT NULL AUTO_INCREMENT,
    `prompt`         TEXT       NOT NULL COMMENT '生成的文案',
    `prompt_english` TEXT       NOT NULL COMMENT '生成的文案英文',
    `create_time`    datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`    datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;
