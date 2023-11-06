import express from 'express';

const router = express.Router();

router.use('/draw', require('./draw').default);
router.use('/user', require('./user').default);
router.use('/quota', require('./quota').default);
router.use('/login', require('./login').default);
router.use('/admin', require('./admin').default);

export default router;
