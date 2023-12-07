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

async function generateInviteCode() {
    const inviteCode = uuidv4().substring(0, 4);
    const user = await User.getByInviteCode(inviteCode);
    if (user) {
        return generateInviteCode();
    }
    return inviteCode;
}

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
        inviteCode?: string;
    } = {};

    if (user) {
        logger.info(`[API_LOGS][/login] Login success, user_id: ${user.user_id}, openid: ${openid}`);

        if (session_key !== user.session_key) {
            logger.info(`[API_LOGS][/login] session_key changed, user_id: ${user.user_id}, openid: ${openid}`);
            await user.update({ session_key: session_key });
        }

        //如果有该用户
        result.userId = user.user_id;
        result.nickname = user.nickname;
        result.sessionKey = user.session_key;
        result.inviteCode = user.invite_code;
    } else {
        logger.info(`[API_LOGS][/login] New user, openid: ${openid}`);
        const inviteCode = await generateInviteCode();
        logger.info(`[API_LOGS][/login] Invite code: ${inviteCode}`);
        //如果没有该用户，创建一个新用户
        user = await User.create({
            nickname: 'wx_' + inviteCode,
            avatar_url: '',
            user_id: uuidv4(),
            appid: appId,
            openid: openid,
            unionid: '',
            session_key: session_key,
            access_token: '',
            invite_code: inviteCode,
        });
        logger.info(`[API_LOGS][/login] New user created, user_id: ${user.user_id}, openid: ${openid}`);
        await userQuotaHistoryService.initQuota({ userId: user.user_id });

        result.userId = user.user_id;
        result.nickname = user.nickname;
        result.sessionKey = user.session_key;
        result.inviteCode = user.invite_code;
    }

    res.status(200).send(result);
});

async function generateInviteInfo({ loginUserId, inviteBy }: { loginUserId: string; inviteBy: string }) {
    const logPre = '[login][generateInviteInfo]';

    if (!inviteBy) {
        logger.info(`${logPre} No invite by [end]`);
        return;
    }

    logger.info(`${logPre} Invite by: ${inviteBy}, login user id: ${loginUserId}`);

    const user = await User.findOne({ where: { user_id: loginUserId } });
    if (user.invited_by_user_id) {
        logger.info(`${logPre} User[${loginUserId}] already has invite user: ${user.invited_by_user_id} [end]`);
        return;
    }

    const invitedByUser = await User.getByInviteCode(inviteBy);
    if (!invitedByUser) {
        logger.error(`${logPre} invalid invite user not found, inviteBy: ${inviteBy} [end]`);
        return;
    }

    // check if invite user id is same with login user id
    const invitedByUserId = invitedByUser.user_id;
    if (loginUserId === invitedByUserId) {
        logger.info(`${logPre} Invite user id is same with login user id [end]`);
        return;
    }

    // update invite user id
    user.invited_by_user_id = invitedByUserId;
    await user.save();
    logger.info(`${logPre} Update user[${loginUserId}] invite user id to ${invitedByUserId}`);
    // update invite user quota
    await userQuotaHistoryService.addQuotaForInvite({ userId: invitedByUserId });
    logger.info(`${logPre} Add quota for user[${invitedByUserId}]`);

    logger.info(`${logPre} success`);
}

/**
 * @api {get} /login/inviteCode 邀请码
 */
router.post('/getPhoneNumber', async (req: any, res) => {
    try {
        const logPre = '[API_LOGS][/login/getPhoneNumber]';
        const { user_id: userId, inviteBy, encryptedData, iv, code, session_key: sessionKey } = req.body;
        logger.info(`${logPre} userId: ${userId}, sessionKey: ${sessionKey}, code: ${code}`);

        const wxBizDataCrypt = new WxBizDataCrypt(appId, sessionKey);
        const data = wxBizDataCrypt.decryptData(encryptedData, iv);
        logger.info(`${logPre} ${JSON.stringify(data)}`);

        const { phoneNumber, countryCode } = data;

        const user = await User.getRawByUserId(userId);
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

        await generateInviteInfo({ loginUserId: userId, inviteBy: inviteBy });

        const token = signToken(user);

        res.status(200).send({
            success: true,
            data: { ...user, token: token },
        });
    } catch (e) {
        logger.error(`[API_LOGS][/login/getPhoneNumber] ${e.message}`);
        res.status(400).send({
            success: false,
            message: e.message,
        });
    }
});

export default router;
