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
    `status`             INT        NULL     DEFAULT 0 COMMENT '生成状态',
    `images`             TEXT       NOT NULL COMMENT '生成的图片objectName, 是个string数组Json',
    `is_private`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否私有',
    `is_starred`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否收藏',
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

# user quota table
CREATE TABLE `user_quota`
(
    `id`          bigint(20) NOT NULL AUTO_INCREMENT,
    `user_id`     varchar(36)         DEFAULT NULL COMMENT '用户id',
    `quota`       INT        NOT NULL DEFAULT 0 COMMENT '用户配额',
    `create_time` datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;

# user quota history table
CREATE TABLE `user_quota_history`
(
    `id`            bigint(20)  NOT NULL AUTO_INCREMENT,
    `user_id`       varchar(36)          DEFAULT NULL COMMENT '用户id',
    `quota_before`  INT         NOT NULL COMMENT '变化前的额度',
    `quota_after`   INT         NOT NULL COMMENT '变化后的额度',
    `change_amount` INT         NOT NULL COMMENT '额度变化的数量',
    `change_type`   varchar(20) NOT NULL COMMENT '额度变化类型（例如：增加: 1、减少: 2）',
    `change_reason` varchar(255)         DEFAULT NULL COMMENT '额度变化的原因',
    `create_time`   datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`   datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4;
