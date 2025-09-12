const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户登录
router.post('/login', userController.login);

// 测试路由
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API is working!', timestamp: new Date() });
});

// 更新用户信息
router.put('/:userId', userController.updateUser);

// 添加紧急联系人
router.post('/:userId/contacts', userController.addEmergencyContact);

// SOS功能
router.post('/sos', userController.handleSOS);

module.exports = router; 