import express from 'express';
import index from './router';
import { Logger } from './lib/logger';
import { banner } from './lib/banner';
import { loadMonitor } from './loaders/loadMonitor';
import { loadWinston } from './loaders/winstonLoader';
import { env } from './env';
import { executeTaskFromQueue } from './lib/queue/generate-queue';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', index);

loadMonitor(app);
loadWinston();
const log = new Logger(__filename);

app.listen(env.app.port, () => {
    banner(log);
});

/*
 * 启动executeTaskFromQueue()，每2秒执行一次
 */
setInterval(async () => {
    await executeTaskFromQueue();
}, 2000);
