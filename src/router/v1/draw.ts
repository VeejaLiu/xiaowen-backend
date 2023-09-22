import express from 'express';

const fetch = require('node-fetch');
const router = express.Router();

import { Logger } from '../../lib/logger';
const logger = new Logger(__filename);

router.post('', async (req, res) => {
    logger.info(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    const { prompt } = req.body;

    const response = await fetch('http://127.0.0.1:10102/draw', {
        method: 'POST',
        // request a image
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: `${prompt}`,
        }),
    });
    const buffer = await response.buffer();
    const base64 = buffer.toString('base64');

    // result is an image in base64 format
    // res.set('Content-Type', 'image/png');
    res.send(buffer);
});

export default router;
