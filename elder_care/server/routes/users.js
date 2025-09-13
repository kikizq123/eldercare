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

// 生成邀请码
router.post('/invite-code', userController.generateInviteCode);

// 家庭绑定
router.post('/bind', userController.bindFamily);

// 解除家庭绑定
router.post('/unbind', userController.unbindFamily);

// 获取家庭成员列表
router.get('/:userId/family', userController.getFamilyMembers);

// SOS功能
router.post('/sos', userController.handleSOS);

module.exports = router; 