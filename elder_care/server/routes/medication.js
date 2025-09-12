const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');

// 添加用药计划
router.post('/', medicationController.addMedication);

// 获取今日用药计划
router.get('/today', medicationController.getTodayMedications);

// 标记用药已服用
router.post('/taken', medicationController.markTaken);

module.exports = router; 