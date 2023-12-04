import { PromptHistory, User, UserGenerateHistory } from '../../models';
import { USER_QUOTA_HISTORY_CONSTANT } from '../../constant';
import { draw } from '../../clients/generate-server/generate';
import { Logger } from '../logger';
import { userQuotaHistoryService } from '../../general/user_quota_history';
import { WechatApis } from '../../clients/wechat/WechatApis';
import { TATTOO_STYLES } from '../../constant/style';

const logger = new Logger(__filename);

export function addTaskIntoQueue(generateHistoryId: number) {
    // TODO
}

async function sendNotification({
    userGenerateHistory,
    promptHistory,
    success,
}: {
    userGenerateHistory: UserGenerateHistory;
    promptHistory: PromptHistory;
    success: boolean;
}) {
    await userGenerateHistory.reload();
    if (userGenerateHistory.notification !== 1) {
        logger.info(`[generate-queue][sendNotification][${userGenerateHistory.id}] notification is not enabled`);
        return;
    }
    const openId = await User.getOpenId({ userId: userGenerateHistory.user_id });
    await WechatApis.sendTemplateMessage({
        touser: openId,
        style: TATTOO_STYLES.find((style) => style.index === userGenerateHistory.style)?.name || '',
        prompt: promptHistory.prompt,
    });
}

export async function executeTaskFromQueue() {
    /*
     * Get a task from queue
     */
    const generateHistory = await UserGenerateHistory.findOne({
        where: { status: USER_QUOTA_HISTORY_CONSTANT.STATUS.ONGOING },
        order: [['id', 'ASC']],
    });
    if (!generateHistory) {
        // logger.info(`[generate-queue][executeTaskFromQueue] No task in queue`);
        return;
    }
    logger.info(
        `[generate-queue][executeTaskFromQueue] taskId: ${generateHistory.id}, promptId: ${generateHistory.prompt_history_id}`,
    );

    const promptHistory = await PromptHistory.findOne({
        where: { id: generateHistory.prompt_history_id },
    });
    if (!promptHistory) {
        logger.error(`[generate-queue][executeTaskFromQueue] promptHistory not found`);
        await generateHistory.update({
            status: USER_QUOTA_HISTORY_CONSTANT.STATUS.FAILED,
        });
        return;
    }
    const promptEnglish = promptHistory.prompt_english;
    logger.info(`[generate-queue][executeTaskFromQueue] promptEnglish: ${promptEnglish}`);

    /*
     * draw
     */
    try {
        logger.info(`[generate-queue][executeTaskFromQueue] start draw`);
        const startTime = new Date().getTime();
        const result = await draw({ style: generateHistory.style, prompt: promptEnglish });
        logger.info(`[generate-queue][executeTaskFromQueue] draw result: ${JSON.stringify(result)}`);
        const endTime = new Date().getTime();
        // update generate history
        await generateHistory.update({
            status: USER_QUOTA_HISTORY_CONSTANT.STATUS.SUCCESS,
            images: JSON.stringify(result),
            generate_used_time: endTime - startTime,
        });
        logger.info(`[generate-queue][executeTaskFromQueue] Update prompt history status to success`);

        // 发送成功通知
        await sendNotification({ userGenerateHistory: generateHistory, promptHistory: promptHistory, success: true });
    } catch (e) {
        if (generateHistory.user_id === 'admin') {
            return;
        }
        logger.error(`[generate-queue][executeTaskFromQueue] draw error: ${e}`);
        await generateHistory.update({
            status: USER_QUOTA_HISTORY_CONSTANT.STATUS.FAILED,
        });
        logger.info(`[generate-queue][executeTaskFromQueue] Update prompt history status to failed`);

        await userQuotaHistoryService.refundQuotaForGenerate({ userId: generateHistory.user_id });
        logger.info(`[generate-queue][executeTaskFromQueue] Refund quota`);
        // 发送失败通知
        // await sendNotification({ userGenerateHistory: generateHistory, promptHistory: promptHistory, success: true });
    }
}
