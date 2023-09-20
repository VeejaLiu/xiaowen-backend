import express from 'express';

const router = express.Router();

router.use('/draw', require('./draw').default);

export default router;
