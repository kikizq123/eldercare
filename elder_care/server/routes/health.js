const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// 添加健康数据
router.post('/', healthController.addHealthData);

// 获取最新健康数据
router.get('/latest', healthController.getLatestHealthData);

// 获取健康数据趋势
router.get('/trend', healthController.getHealthTrend);

module.exports = router; 