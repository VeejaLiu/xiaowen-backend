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
    const { code, inviteCode } = req.body;
    const wxRes = await WechatApis.code2session(code);
    const { openid, session_key } = wxRes;
    logger.info(`[API_LOGS][/login] ${JSON.stringify(wxRes)}`);

    //查询数据库中是否有该用户
    let user = await User.findOne({ where: { openid: openid } });

    const result: {
        userId?: string;
        nickname?: string;
        sessionKey?: string;
    } = {};

    if (user) {
        logger.info(`[API_LOGS][/login] Login success, user_id: ${user.user_id}, openid: ${openid}`);

        if (session_key !== user.session_key) {
            logger.info(`[API_LOGS][/login] session_key changed, user_id: ${user.user_id}, openid: ${openid}`);
            await User.update(
                { session_key: session_key },
                {
                    where: {
                        openid: openid,
                    },
                },
            );
            user = await User.findOne({ where: { openid: openid } });
        }

        //如果有该用户
        result.userId = user.user_id;
        result.nickname = user.nickname;
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

        result.userId = user.user_id;
        result.nickname = user.nickname;
        result.sessionKey = user.session_key;
    }

    res.status(200).send(result);
});

async function generateInviteInfo({ loginUserId, inviteUserId }: { inviteUserId: string; loginUserId: string }) {
    const logPre = '[login][generateInviteInfo]';

    if (!inviteUserId) {
        logger.info(`${logPre} No invite user [end]`);
        return;
    }

    // check if invite user id is same with login user id
    if (loginUserId === inviteUserId) {
        logger.info(`${logPre} Invite user id is same with login user id [end]`);
        return;
    }

    logger.info(`${logPre} Invite user id: ${inviteUserId}, login user id: ${loginUserId}`);

    const user = await User.getByUserId(loginUserId);
    if (user.invite_user_id) {
        logger.info(`${logPre} User[${loginUserId}] already has invite user: ${user.invite_user_id} [end]`);
        return;
    }

    const inviteUser = await User.getByUserId(inviteUserId);
    if (!inviteUser) {
        logger.error(`${logPre} invalid invite user not found, inviteUserId: ${inviteUserId} [end]`);
        return;
    }

    // update invite user id
    await User.update({ invite_user_id: inviteUserId }, { where: { user_id: loginUserId } });
    logger.info(`${logPre} Update user[${loginUserId}] invite user id to ${inviteUserId}`);
    // update invite user quota
    await userQuotaHistoryService.addQuotaForInvite({ userId: inviteUserId });
    logger.info(`${logPre} Add quota for user[${inviteUserId}]`);

    logger.info(`${logPre} success`);
}

/**
 * @api {get} /login/inviteCode 邀请码
 */
router.post('/getPhoneNumber', async (req: any, res) => {
    const logPre = '[API_LOGS][/login/getPhoneNumber]';
    const sessionKey = req.headers.session_key;
    const { user_id: userId, inviteUserId, encryptedData, iv, code } = req.body;
    logger.info(`${logPre} userId: ${userId}, sessionKey: ${sessionKey}, code: ${code}`);

    const wxBizDataCrypt = new WxBizDataCrypt(appId, sessionKey);
    const data = wxBizDataCrypt.decryptData(encryptedData, iv);
    logger.info(`${logPre} ${JSON.stringify(data)}`);

    const { phoneNumber, countryCode } = data;

    const user = await User.getByUserId(userId);
    if (!user) {
        return res.status(400).send({
            success: false,
            message: 'User not found',
        });
    }
    await User.updatePhoneInfo({
        userId: userId,
        phoneCode: countryCode,
        phoneNumber: phoneNumber,
    });

    await generateInviteInfo({ loginUserId: userId, inviteUserId });

    const token = signToken(user);

    res.status(200).send({
        success: true,
        data: { ...user, token: token },
    });
});

export default router;
