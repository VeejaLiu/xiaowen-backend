import express from 'express';
import { User } from '../../models';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '../../lib/token/signToken';
import { WechatApis } from '../../clients/wechat/WechatApis';
import { Logger } from '../../lib/logger';
import { env } from '../../env';
import { userQuotaHistoryService } from '../../general/user_quota_history';
import { verifyToken } from '../../lib/token/verifyToken';

const router = express.Router();
const logger = new Logger(__filename);
const appId = env.wechatMiniProgram.appid;
const WxBizDataCrypt = require('../../clients/wechat/WXBizDataCrypt');

/**
 * @api {get} /login 用户登录
 */
router.post('', async (req, res) => {
    const { code } = req.body;
    const wxRes = await WechatApis.code2session(code);
    const { openid, session_key } = wxRes;
    logger.info(`[API_LOGS][/login] ${JSON.stringify(wxRes)}`);

    //查询数据库中是否有该用户
    let user = await User.findOne({ where: { openid: openid } });

    const result: {
        nickname?: string;
        token?: string;
        createTime?: string;
        sessionKey?: string;
    } = {};

    if (user) {
        logger.info(`[API_LOGS][/login] Login success, user_id: ${user.user_id}, openid: ${openid}`);

        if (session_key !== user.session_key) {
            logger.info(`[API_LOGS][/login] session_key changed, user_id: ${user.user_id}, openid: ${openid}`);
            user.session_key = session_key;
            await user.save();
        }

        //如果有该用户
        result.nickname = user.nickname;
        result.token = 'xxx';
        result.createTime = user.create_time.toUTCString();
        result.sessionKey = user.session_key;
    } else {
        logger.info(`[API_LOGS][/login] New user, openid: ${openid}`);
        //如果没有该用户，创建一个新用户
        user = await User.create({
            nickname: 'wx_' + uuidv4().substring(0, 8),
            avatar_url: '',
            user_id: uuidv4(),
            appid: appId,
            openid: openid,
            unionid: '',
            session_key: session_key,
            access_token: '',
        });
        logger.info(`[API_LOGS][/login] New user created, user_id: ${user.user_id}, openid: ${openid}`);
        await userQuotaHistoryService.initQuota({ userId: user.user_id });

        result.nickname = user.nickname;
        result.token = 'xxx';
        result.createTime = user.create_time.toUTCString();
        result.sessionKey = user.session_key;
    }

    // 签发JWT token
    const token = signToken(user);
    result.token = token;

    res.status(200).send(result);
});

router.use(verifyToken).post('/getPhoneNumber', async (req: any, res) => {
    const userId = req.user.userId;
    const { encryptedData, iv, code } = req.body;

    // get session_key
    const user = await User.findOne({ where: { user_id: userId } });
    const sessionKey = user.session_key;

    const wxBizDataCrypt = new WxBizDataCrypt(appId, sessionKey);
    const data = wxBizDataCrypt.decryptData(encryptedData, iv);
    logger.info(`[API_LOGS][/getPhoneNumber] ${JSON.stringify(data)}`);

    res.status(200).send();
});

export default router;
