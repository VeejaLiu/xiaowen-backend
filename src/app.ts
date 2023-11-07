import express from 'express';
import index from './router';
import { Logger } from './lib/logger';
import { banner } from './lib/banner';
import { loadMonitor } from './loaders/loadMonitor';
import { loadWinston } from './loaders/winstonLoader';
import { env } from './env';
import { executeTaskFromQueue } from './lib/queue/generate-queue';

const app = express();

// 修复跨域问题
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', index);

loadMonitor(app);
loadWinston();
const log = new Logger(__filename);

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(env.app.port, () => {
    banner(log);
});

/*
 * 启动executeTaskFromQueue()，每2秒执行一次
 */
async function runTask() {
    await executeTaskFromQueue();
    setTimeout(runTask, 2000);
}

runTask();
