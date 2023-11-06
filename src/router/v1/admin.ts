import express from 'express';
import { Logger } from '../../lib/logger';
import { translate } from '../../clients/baidu-translate/BaiduTranslate';
import { PromptHistory, UserGenerateHistory } from '../../models';
import { USER_QUOTA_HISTORY_CONSTANT } from '../../constant';

const router = express.Router();

const logger = new Logger(__filename);

/**
 * 绘制图片
 *
 * @route POST /draw
 * @param {string} style - 绘制风格
 * @param {string} prompt - 绘制内容
 *
 */
router.post('/draw', async (req: any, res) => {
    logger.info(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    let { style, prompt } = req.body;

    /*
     * prompt process
     */
    prompt = prompt.trim();
    if (!prompt || prompt.length === 0) {
        logger.error(`[API_LOGS][/draw] prompt is empty`);
        return res.status(400).send('prompt is empty');
    }
    const transRes = await translate(prompt);

    /*
     * create prompt history record
     */
    const promptHistory = await PromptHistory.create({
        prompt: prompt,
        prompt_english: transRes,
    });
    const generateHistory = await UserGenerateHistory.create({
        user_id: 'admin',
        style: style,
        prompt_history_id: promptHistory.id,
        status: USER_QUOTA_HISTORY_CONSTANT.STATUS.ONGOING,
        images: '',
    });

    logger.info(`[API_LOGS][/draw] generateHistory: ${JSON.stringify(generateHistory.id)}`);
    res.send({
        generateHistoryId: generateHistory.id,
    });
});

router.get('/history', async (req: any, res) => {
    logger.info(`[API_LOGS][/history] ${JSON.stringify(req.body)}`);
    let { page, pageSize } = req.query;
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    const history = await UserGenerateHistory.findAndCountAll({
        where: {
            user_id: 'admin',
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: [['create_time', 'DESC']],
    });
    res.send({
        history: history.rows,
        total: history.count,
    });
});
export default router;
