import { UserQuota, UserQuotaHistory } from '../models';
import { QUOTA_CONSTANT, USER_QUOTA_HISTORY_CONSTANT } from '../constant';
import { Logger } from '../lib/logger';

const logger = new Logger(__filename);
export class userQuotaHistoryService {
    /**
     * 生成消费，减少配额
     */
    static async consumeQuotaForGenerate({ userId }: { userId: string }) {
        try {
            // check this user's quota
            const userQuota = await UserQuota.getByUserId(userId);
            if ((userQuota?.quota || 0) < QUOTA_CONSTANT.GENERATE) {
                throw new Error(`user's quota is not enough`);
            }
            // consume user's quota
            await UserQuotaHistory.addHistory({
                userId: userId,
                changeType: USER_QUOTA_HISTORY_CONSTANT.CHANGE_TYPE.SUBTRACT,
                changeReason: USER_QUOTA_HISTORY_CONSTANT.CHANGE_REASON.SUBTRACT.GENERATE,
                changeAmount: QUOTA_CONSTANT.GENERATE,
            });
            // update user's quota
            const updateRes = await userQuota.update({
                quota: userQuota.quota - QUOTA_CONSTANT.GENERATE,
            });
            return true;
        } catch (e) {
            logger.error(`[userQuotaHistoryService][consumeQuotaForGenerate] ${e.message}`);
            throw e;
        }
    }

    /**
     * 生成失败，退回配额
     */
    static async refundQuotaForGenerate({ userId }: { userId: string }) {
        try {
            const userQuota = await UserQuota.getByUserId(userId);
            // refund user's quota
            await UserQuotaHistory.addHistory({
                userId: userId,
                changeType: USER_QUOTA_HISTORY_CONSTANT.CHANGE_TYPE.ADD,
                changeReason: USER_QUOTA_HISTORY_CONSTANT.CHANGE_REASON.ADD.REFUND_BY_GENERATE_FAILED,
                changeAmount: QUOTA_CONSTANT.GENERATE,
            });
            // update user's quota
            await userQuota.update({
                quota: userQuota.quota + QUOTA_CONSTANT.GENERATE,
            });
            return true;
        } catch (e) {
            logger.error(`[userQuotaHistoryService][refundQuotaForGenerate] ${e.message}`);
            throw e;
        }
    }
}
