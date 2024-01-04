import { WechatApis } from '../../clients/wechat/WechatApis';
import { User } from '../../models';
import { v4 as uuidv4 } from 'uuid';
import { userQuotaHistoryService } from '../user_quota_history';
import { Logger } from '../../lib/logger';
import { env } from '../../env';

const logger = new Logger(__filename);
const appId = env.wechatMiniProgram.appid;

async function generateInviteCode() {
    const inviteCode = uuidv4().substring(0, 4);
    const user = await User.getByInviteCode(inviteCode);
    if (user) {
        return generateInviteCode();
    }
    return inviteCode;
}

export async function login({ code }: { code: string }): Promise<{
    userId?: string;
    nickname?: string;
    sessionKey?: string;
    inviteCode?: string;
}> {
    logger.info(`[login] code: ${code}`);
    if (!code || code === '') {
        throw new Error('Missing code');
    }
    const wxRes = await WechatApis.code2session(code);
    const { openid, session_key } = wxRes;
    logger.info(`[login] ${JSON.stringify(wxRes)}`);

    //查询数据库中是否有该用户
    let user = await User.findOne({ where: { openid: openid } });

    const result: {
        userId?: string;
        nickname?: string;
        sessionKey?: string;
        inviteCode?: string;
    } = {};

    if (user) {
        logger.info(`[login] Login success, user_id: ${user.user_id}, openid: ${openid}`);

        if (session_key !== user.session_key) {
            logger.info(`[login] session_key changed, user_id: ${user.user_id}, openid: ${openid}`);
            await user.update({ session_key: session_key });
        }

        //如果有该用户
        result.userId = user.user_id;
        result.nickname = user.nickname;
        result.sessionKey = user.session_key;
        result.inviteCode = user.invite_code;
    } else {
        logger.info(`[login] New user, openid: ${openid}`);
        const inviteCode = await generateInviteCode();
        logger.info(`[login] Invite code: ${inviteCode}`);
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
        logger.info(`[login] New user created, user_id: ${user.user_id}, openid: ${openid}`);
        await userQuotaHistoryService.initQuota({ userId: user.user_id });

        result.userId = user.user_id;
        result.nickname = user.nickname;
        result.sessionKey = user.session_key;
        result.inviteCode = user.invite_code;
    }
    return result;
}
