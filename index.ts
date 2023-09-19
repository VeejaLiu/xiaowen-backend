import express from "express";

const router = express.Router();

router.get('/health_check', (req, res) => {
  res.send('ok');
})

router.post('/health_check', (req, res) => {
  res.send({
    message: 'ok',
    data: {...req.body}
  });
})

export default router;
