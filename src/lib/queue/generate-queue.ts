import { PromptHistory, UserGenerateHistory } from '../../models';
import { USER_QUOTA_HISTORY_CONSTANT } from '../../constant';
import { draw } from '../../clients/generate-server/generate';
import { Logger } from '../logger';
import { userQuotaHistoryService } from '../../general/user_quota_history';

const logger = new Logger(__filename);

export function addTaskIntoQueue(generateHistoryId: number) {
    // TODO
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
        const endTime = new Date().getTime();
        // update generate history
        await generateHistory.update({
            status: USER_QUOTA_HISTORY_CONSTANT.STATUS.SUCCESS,
            images: JSON.stringify(result),
            generate_used_time: endTime - startTime,
        });
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
    }
}
