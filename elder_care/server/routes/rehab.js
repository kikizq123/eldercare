const express = require('express');
const router = express.Router();
const rehabController = require('../controllers/rehabController');

// 康复计划相关路由
router.post('/', rehabController.createPlan);
router.get('/', rehabController.getUserPlans);
router.delete('/:id', rehabController.deletePlan);

// 康复打卡
router.post('/checkin', rehabController.checkin);

module.exports = router;