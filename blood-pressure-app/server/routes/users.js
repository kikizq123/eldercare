const express = require('express');
const router = express.Router();
const database = require('../config/database');
const User = require('../models/User');

/**
 * 获取用户列表（管理员功能）
 * GET /api/v1/users
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // 开发模式
    if (database.isDevelopment()) {
      const mockUsers = Array.from({ length: 5 }, (_, i) => ({
        _id: `mock_user_${i + 1}`,
        openId: `mock_openid_${i + 1}`,
        nickname: `测试用户${i + 1}`,
        avatar: '',
        stats: {
          totalRecords: Math.floor(Math.random() * 50),
          lastRecordDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          averageSystolic: 120 + Math.floor(Math.random() * 20),
          averageDiastolic: 80 + Math.floor(Math.random() * 15)
        },
        status: ['active', 'regular', 'inactive'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
      }));

      return res.json({
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total: 5,
            totalPages: 1
          }
        },
        message: '获取用户列表成功（开发模式）'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find({})
      .select('-openId -unionId') // 不返回敏感信息
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      },
      message: '获取用户列表成功'
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败',
      code: 'GET_USERS_ERROR'
    });
  }
});

/**
 * 获取用户详情
 * GET /api/v1/users/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开发模式
    if (database.isDevelopment()) {
      const mockUser = {
        _id: id,
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
          totalRecords: 25,
          lastRecordDate: new Date(),
          averageSystolic: 125,
          averageDiastolic: 80
        },
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };

      return res.json({
        success: true,
        data: mockUser,
        message: '获取用户详情成功（开发模式）'
      });
    }

    const user = await User.findById(id).select('-openId -unionId');
    
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
      message: '获取用户详情成功'
    });

  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户详情失败',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * 删除用户（管理员功能）
 * DELETE /api/v1/users/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开发模式
    if (database.isDevelopment()) {
      return res.json({
        success: true,
        message: '用户删除成功（开发模式）'
      });
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // TODO: 同时删除用户的所有血压记录
    const BloodPressure = require('../models/BloodPressure');
    await BloodPressure.deleteMany({ userId: id });

    res.json({
      success: true,
      message: '用户及相关数据删除成功'
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败',
      code: 'DELETE_USER_ERROR'
    });
  }
});

/**
 * 获取系统统计信息
 * GET /api/v1/users/stats/system
 */
router.get('/stats/system', async (req, res) => {
  try {
    // 开发模式
    if (database.isDevelopment()) {
      const mockStats = {
        totalUsers: 156,
        activeUsers: 89, // 7天内有记录的用户
        newUsersThisWeek: 12,
        totalRecords: 2468,
        recordsThisWeek: 145,
        averageRecordsPerUser: 15.8,
        topActiveUsers: [
          { nickname: '健康达人', totalRecords: 89, lastActive: new Date() },
          { nickname: '运动爱好者', totalRecords: 76, lastActive: new Date() },
          { nickname: '养生专家', totalRecords: 65, lastActive: new Date() }
        ]
      };

      return res.json({
        success: true,
        data: mockStats,
        message: '获取系统统计成功（开发模式）'
      });
    }

    // 获取用户统计
    const totalUsers = await User.countDocuments();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.countDocuments({
      'stats.lastRecordDate': { $gte: sevenDaysAgo }
    });
    
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // 获取血压记录统计
    const BloodPressure = require('../models/BloodPressure');
    const totalRecords = await BloodPressure.countDocuments();
    const recordsThisWeek = await BloodPressure.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // 获取最活跃用户
    const topActiveUsers = await User.find({})
      .sort({ 'stats.totalRecords': -1 })
      .limit(5)
      .select('nickname stats.totalRecords stats.lastRecordDate')
      .lean();

    const stats = {
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalRecords,
      recordsThisWeek,
      averageRecordsPerUser: totalUsers > 0 ? (totalRecords / totalUsers).toFixed(1) : 0,
      topActiveUsers: topActiveUsers.map(user => ({
        nickname: user.nickname,
        totalRecords: user.stats.totalRecords,
        lastActive: user.stats.lastRecordDate
      }))
    };

    res.json({
      success: true,
      data: stats,
      message: '获取系统统计成功'
    });

  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取系统统计失败',
      code: 'GET_SYSTEM_STATS_ERROR'
    });
  }
});

module.exports = router;