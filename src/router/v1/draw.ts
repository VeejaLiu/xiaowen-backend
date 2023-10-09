import express from 'express';
import { draw } from '../../service/draw';
import path from 'path';
import fs from 'fs';
import { putObject } from '../../clients/minio/minio';

const fetch = require('node-fetch');
const router = express.Router();

import { Logger } from '../../lib/logger';
const log = new Logger(__filename);

router.post('', async (req, res) => {
    log.info(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    const { prompt } = req.body;
    // const result = await draw(prompt);

    // const filePath = path.join(__dirname, `../../public/${result.fileName}`);

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
