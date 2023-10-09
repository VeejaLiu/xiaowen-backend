import express from 'express';
const fetch = require('node-fetch');
const router = express.Router();

import { Logger } from '../../lib/logger';
import { translate } from '../../clients/baidu-translate/BaiduTranslate';
const log = new Logger(__filename);

router.post('', async (req, res) => {
    log.info(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    let { style, prompt } = req.body;
    prompt = prompt.trim();
    if (!prompt || prompt.length === 0) {
        log.error(`[API_LOGS][/draw] prompt is empty`);
        return res.status(400).send('prompt is empty');
    }

    const transRes = await translate(prompt);

    // TODO move to generate server client
    // const response = await fetch('http://127.0.0.1:10102/draw', {
    //     method: 'POST',
    //     // request a image
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         prompt: `${prompt}`,
    //     }),
    // });

    res.send({
        images: [`image url 1`, `image url 2`, `image url 3`, `image url 4`],
    });
});

export default router;
