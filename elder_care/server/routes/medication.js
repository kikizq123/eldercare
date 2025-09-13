const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');

// 添加用药计划
router.post('/', medicationController.addMedication);

// 获取用户的所有用药计划
router.get('/', medicationController.getUserMedications);

// 获取今日用药计划
router.get('/today', medicationController.getTodayMedications);

// 更新用药计划
router.put('/:id', medicationController.updateMedication);

// 删除用药计划
router.delete('/:id', medicationController.deleteMedication);

// 标记用药已服用
router.post('/taken', medicationController.markTaken);

module.exports = router; 