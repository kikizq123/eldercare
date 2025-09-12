const express = require('express');
const router = express.Router();
const database = require('../config/database');
const User = require('../models/User');

// 模拟数据（开发模式使用）
const mockUser = {
  _id: 'mock_user_id_123',
  openId: 'mock_openid_123',
  nickname: '测试用户',
  avatar: '',
  settings: {
    normalRange: {
      systolic: { min: 90, max: 140 },
      diastolic: { min: 60, max: 90 }
    },
    reminders: { enabled: false, times: [] }
  },
  stats: {
    totalRecords: 5,
    lastRecordDate: new Date(),
    averageSystolic: 125,
    averageDiastolic: 80
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * 微信小程序登录
 * POST /api/v1/auth/wxlogin
 */
router.post('/wxlogin', async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: '缺少微信登录code',
        code: 'MISSING_WX_CODE'
      });
    }

    // 开发模式：返回模拟数据
    if (database.isDevelopment()) {
      console.log('🛠️  开发模式：使用模拟用户数据');
      
      return res.json({
        success: true,
        data: {
          user: mockUser,
          token: 'mock_token_' + Date.now(),
          isNewUser: false
        },
        message: '登录成功（开发模式）'
      });
    }

    // TODO: 生产模式下的微信登录逻辑
    // 1. 使用code向微信服务器获取openId
    // 2. 根据openId查找或创建用户
    // 3. 生成JWT token
    
    const user = await User.findOrCreateByOpenId('temp_openid', userInfo);
    
    res.json({
      success: true,
      data: {
        user,
        token: 'temp_token_' + Date.now(),
        isNewUser: user.stats.totalRecords === 0
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
      code: 'WX_LOGIN_ERROR'
    });
  }
});

/**
 * 获取用户信息
 * GET /api/v1/auth/profile
 */
router.get('/profile', async (req, res) => {
  try {
    // 开发模式：返回未登录状态
    if (database.isDevelopment()) {
      return res.status(401).json({
        success: false,
        error: '未登录，请先登录',
        code: 'NOT_LOGGED_IN'
      });
    }

    // TODO: 从token中获取用户ID
    const userId = req.headers.authorization; // 临时方案
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '获取用户信息成功'
    });

  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

/**
 * 更新用户设置
 * PUT /api/v1/auth/settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    
    // 开发模式
    if (database.isDevelopment()) {
      return res.json({
        success: true,
        data: { ...mockUser, settings: { ...mockUser.settings, ...settings } },
        message: '设置更新成功（开发模式）'
      });
    }

    // TODO: 从token中获取用户ID
    const userId = req.headers.authorization;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { settings } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: user,
      message: '设置更新成功'
    });

  } catch (error) {
    console.error('更新用户设置失败:', error);
    res.status(500).json({
      success: false,
      error: '更新设置失败',
      code: 'UPDATE_SETTINGS_ERROR'
    });
  }
});

module.exports = router;