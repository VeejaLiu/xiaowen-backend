import express from 'express';
import { draw } from '../../service/draw';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.post('', async (req, res) => {
    console.log(`[API_LOGS][/draw] ${JSON.stringify(req.body)}`);
    const { prompt } = req.body;
    const result = await draw(prompt);

    const filePath = path.join(__dirname, `./${result.fileName}`);
    const stream = fs.createReadStream(filePath);

    res.set('Content-Type', 'image/jpeg');
    stream.on('data', (chunk) => {
        res.write(chunk);
    });
    stream.on('end', () => {
        res.status(200);
        res.end();
    });
});

export default router;
