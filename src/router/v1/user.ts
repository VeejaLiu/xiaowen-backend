import express from 'express';
import { Logger } from '../../lib/logger';

const router = express.Router();

const log = new Logger(__filename);

router.post('/history', async (req, res) => {
    log.info(`[API_LOGS][/history] ${JSON.stringify(req.body)}`);
    const { keyword, style, start, limit } = req.body;
    log.info(`[API_LOGS][/history] keyword: ${keyword}, style: ${style}, start: ${start}, limit: ${limit}`);

    // TODO: get history from DB

    res.status(200).send({
        data: [
            {
                id: 1,
                prompt: 'A painting of a cat',
                style: 'abstract',
                created_at: 1620000000000,
                image_url: 'https://i.imgur.com/1.jpg',
            },
            {
                id: 2,
                prompt: 'A painting of a dog',
                style: 'abstract',
                created_at: 1620000000000,
                image_url: 'https://i.imgur.com/2.jpg',
            },
            {
                id: 3,
                prompt: 'A painting of a cat',
                style: 'abstract',
                created_at: 1620000000000,
                image_url: 'https://i.imgur.com/3.jpg',
            },
        ],
    });
});

export default router;
