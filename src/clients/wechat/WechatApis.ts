import { getOsEnv } from '../../lib/env';
import { Logger } from '../../lib/logger';
import { env } from '../../env';

const logger = new Logger('WechatApis');

export interface WechatCode2SessionResponse {
    openid: string;
    session_key: string;
}

export class WechatApis {
    private static appId: string = env.wechatMiniProgram.appid;
    private static appSecret = env.wechatMiniProgram.secret;

    static async code2session(code: string): Promise<WechatCode2SessionResponse> {
        try {
            // 调用https://api.weixin.qq.com/sns/jscode2session接口获取openid
            const wxRes = await fetch(
                `https://api.weixin.qq.com/sns/jscode2session?` +
                    `appid=${this.appId}` +
                    `&` +
                    `secret=${this.appSecret}` +
                    `&` +
                    `js_code=${code}` +
                    `&` +
                    `grant_type=authorization_code`,
                {
                    method: 'GET',
                },
            );

            const wxResJson = await wxRes.json();
            if (wxResJson.errcode) {
                throw new Error(wxResJson.errcode);
            }

            return wxResJson;
        } catch (e) {
            logger.error(`[code2session] ${e}`);
            throw e;
        }
    }
}
