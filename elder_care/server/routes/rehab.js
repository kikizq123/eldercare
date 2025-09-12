const express = require('express');
const router = express.Router();
const rehabController = require('../controllers/rehabController');

// 康复计划相关路由
router.post('/plans', rehabController.createPlan);
router.get('/plans/user/:userId', rehabController.getUserPlans);
router.get('/plans/:planId', rehabController.getPlanDetail);
router.put('/plans/:planId', rehabController.updatePlan);
router.delete('/plans/:planId', rehabController.deletePlan);

// 康复记录相关路由
router.post('/records', rehabController.recordExercise);
router.get('/records/user/:userId', rehabController.getRecords);
router.get('/tasks/user/:userId/today', rehabController.getTodayTasks);
router.get('/stats/user/:userId', rehabController.getStats);

module.exports = router;