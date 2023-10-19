import express from 'express';
import { User } from '../../models';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '../../lib/token/signToken';
import { WechatApis } from '../../clients/wechat/WechatApis';
import { Logger } from '../../lib/logger';
import { env } from '../../env';
import { userQuotaHistoryService } from '../../general/user_quota_history';

const router = express.Router();
const logger = new Logger(__filename);
const appId = env.wechatMiniProgram.appid;

/**
 * @api {get} /login 用户登录
 */
router.post('', async (req, res) => {
    const { code } = req.body;
    const wxRes = await WechatApis.code2session(code);
    const { openid, session_key } = wxRes;
    logger.info(`[API_LOGS][/login] ${JSON.stringify(wxRes)}`);

    //查询数据库中是否有该用户
    const user = await User.findOne({ where: { openid: openid } });

    const result: {
        nickname?: string;
        token?: string;
        createTime?: string;
    } = {};

    if (user) {
        logger.info(`[API_LOGS][/login] Login success, user_id: ${user.user_id}, openid: ${openid}`);
        //如果有该用户
        result.nickname = user.nickname;
        result.token = 'xxx';
        result.createTime = user.create_time.toUTCString();
    } else {
        logger.info(`[API_LOGS][/login] New user, openid: ${openid}`);
        //如果没有该用户，创建一个新用户
        const newUser = await User.create({
            nickname: 'wx_' + uuidv4().substring(0, 8),
            avatar_url: '',
            user_id: uuidv4(),
            appid: appId,
            openid: openid,
            unionid: '',
            session_key: session_key,
            access_token: '',
        });
        logger.info(`[API_LOGS][/login] New user created, user_id: ${newUser.user_id}, openid: ${openid}`);
        await userQuotaHistoryService.initQuota({ userId: newUser.user_id });

        result.nickname = newUser.nickname;
        result.token = 'xxx';
        result.createTime = newUser.create_time.toUTCString();
    }

    // 签发JWT token
    const token = signToken(user);
    result.token = token;

    res.status(200).send(result);
});

export default router;
