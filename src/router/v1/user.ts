import express from 'express';
import { Logger } from '../../lib/logger';
import { sequelize } from '../../models/db-config';
import { User, UserQuota } from '../../models';
import { verifyToken } from '../../lib/token/verifyToken';

const router = express.Router();
const logger = new Logger(__filename);

router.use(verifyToken);

/**
 * @api {get} /user/info 获取用户信息
 */
router.get('/info', async (req: any, res) => {
    logger.info(`[API_LOGS][/info] ${JSON.stringify(req.body)}`);
    const { userId } = req.user.user_id;
    logger.info(`[API_LOGS][/info] userId: ${userId}`);

    const user = await User.findOne({ where: { user_id: userId } });
    const userQuota = await UserQuota.findOne({ where: { user_id: userId } });

    res.status(200).send({
        userId: user.user_id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        createTime: user.create_time,
        quota: userQuota.quota,
    });
});

// /**
//  * @api {post} /user/register 用户注册
//  */
// router.post('/register', async (req, res) => {
//     logger.info(`[API_LOGS][/register] ${JSON.stringify(req.body)}`);
//     const { nickname, avatarUrl, openId, appId, unionId, sessionKey, accessKey } = req.body;
//
//     /*
//      * Create a new user
//      */
//     const newUser = await User.create({
//         nickname: nickname,
//         avatar_url: avatarUrl,
//         user_id: uuidv4(),
//         appid: appId,
//         openid: openId,
//         unionid: unionId,
//         session_key: sessionKey,
//         access_token: accessKey,
//     });
//
//     /*
//      * Init user quota
//      */
//     await UserQuotaHistory.create({
//         user_id: newUser.user_id,
//         quota_before: 0,
//         quota_after: 200,
//         change_amount: 200,
//         change_type: USER_QUOTA_HISTORY.CHANGE_TYPE.ADD,
//         change_reason: USER_QUOTA_HISTORY.CHANGE_REASON.ADD.REGISTER,
//     });
//     await UserQuota.create({
//         user_id: newUser.user_id,
//         quota: 200,
//     });
//
//     res.status(200).send();
// });

/**
 * @api {get} /user/history 获取用户生成历史
 */
router.get('/history', async (req: any, res) => {
    logger.info(`[API_LOGS][/history] ${JSON.stringify(req.body)}`);
    const { keyword, style, start, limit } = req.query;
    const { userId } = req.user.user_id;
    logger.info(`[API_LOGS][/history] userId: ${userId}`);

    const sqlRes = await sequelize.query(`
        select ugh.id                 as id,
               ugh.user_id            as user_id,
               ugh.style              as style,
               ph.prompt              as prompt,
               ugh.generate_used_time as generate_used_time,
               ugh.status             as status,
               ugh.images             as images,
               ugh.create_time        as create_time
        from user_generate_history as ugh
                 left join prompt_history as ph
                           on ugh.prompt_history_id = ph.id
        WHERE ugh.user_id = '${userId}'
            ${style ? `AND ugh.style = '${style}'` : ''}
            ${keyword ? `AND ph.prompt LIKE '%${keyword}%'` : ''}
        ORDER BY ugh.id DESC
        LIMIT ${Number(start) || 0}, ${Number(limit) || 10};
    `);
    const countSqlRes = await sequelize.query(`
        select count(ugh.id) as count
        from user_generate_history as ugh
                 left join prompt_history as ph
                           on ugh.prompt_history_id = ph.id
        WHERE ugh.user_id = '${userId}'
            ${style ? `AND ugh.style = '${style}'` : ''}
            ${keyword ? `AND ph.prompt LIKE '%${keyword}%'` : ''}
    `);

    res.status(200).send({
        data: sqlRes[0].map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            style: item.style,
            prompt: item.prompt,
            generateUsedTime: item.generate_used_time,
            status: item.status,
            images: JSON.parse(item.images),
            createTime: item.create_time,
        })),
        total: (countSqlRes[0][0] as any).count,
    });
});

export default router;
