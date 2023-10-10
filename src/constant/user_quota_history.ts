export const USER_QUOTA_HISTORY = {
    CHANGE_TYPE: {
        ADD: 1, // 增加
        SUBTRACT: 2, // 减少
    },

    CHANGE_REASON: {
        ADD: {
            WATCH_AD: 1, // 观看广告
            BUY: 2, // 购买
            INVITE_REGISTER: 3, // 邀请注册
        },
        SUBTRACT: {
            GENERATE: 1, // 普通生成
        },
    },
};
