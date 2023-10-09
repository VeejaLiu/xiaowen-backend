import express from 'express';
import { draw } from '../../service/draw';
import path from 'path';
import fs from 'fs';
import { putObject } from '../../clients/minio/minio';
import { Logger } from '../../lib/logger';

const router = express.Router();

const log = new Logger(__filename);

router.post('', async (req, res) => {
    log.info(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    const { prompt } = req.body;
    const result = await draw(prompt);

    const filePath = path.join(__dirname, `../../public/${result.fileName}`);

    // const stream = fs.createReadStream(filePath);
    const buffer = fs.readFileSync(filePath);
    await putObject(result.fileName, buffer);

    res.status(200);
    res.end();
});

export default router;
