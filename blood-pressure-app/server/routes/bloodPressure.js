const express = require('express');
const router = express.Router();
const database = require('../config/database');
const BloodPressure = require('../models/BloodPressure');
const User = require('../models/User');

// 模拟血压数据（开发模式使用）
const generateMockData = (count = 10) => {
  const mockData = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const measureTime = new Date(now - i * 24 * 60 * 60 * 1000); // 每天一条记录
    const systolic = 110 + Math.floor(Math.random() * 40); // 110-150
    const diastolic = 70 + Math.floor(Math.random() * 25); // 70-95
    
    const record = {
      _id: `mock_bp_${i}`,
      userId: 'mock_user_id_123',
      systolic,
      diastolic,
      measureTime,
      context: {
        timeOfDay: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
        beforeMeasure: {
          activity: 'rest',
          emotion: 'calm'
        }
      },
      notes: i === 0 ? '今天感觉不错' : '',
      source: 'manual',
      // 虚拟字段
      classification: {
        level: systolic < 130 && diastolic < 85 ? 'normal' : 'high_normal',
        name: systolic < 130 && diastolic < 85 ? '正常血压' : '正常高值',
        color: systolic < 130 && diastolic < 85 ? '#1890ff' : '#faad14'
      },
      pulsePressure: systolic - diastolic,
      meanArterialPressure: Math.round(diastolic + (systolic - diastolic) / 3),
      createdAt: measureTime,
      updatedAt: measureTime
    };
    
    mockData.push(record);
  }
  
  return mockData;
};

/**
 * 获取血压记录列表
 * GET /api/v1/blood-pressure?page=1&limit=20&timeRange=30
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      timeRange = 30, // 天数
      startDate,
      endDate
    } = req.query;

    // 开发模式：返回空数据
    if (database.isDevelopment()) {
      return res.json({
        success: true,
        data: {
          records: [],
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total: 0,
            totalPages: 0
          },
          stats: {
            totalRecords: 0,
            avgSystolic: null,
            avgDiastolic: null,
            timeRange: parseInt(timeRange)
          }
        },
        message: '暂无血压记录（开发模式）'
      });
    }

    // TODO: 从token中获取用户ID
    const userId = req.headers.authorization || 'temp_user_id';
    
    // 构建查询条件
    const query = { userId };
    
    if (startDate || endDate || timeRange) {
      query.measureTime = {};
      
      if (startDate) {
        query.measureTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.measureTime.$lte = new Date(endDate);
      }
      if (timeRange && !startDate && !endDate) {
        const rangeDate = new Date();
        rangeDate.setDate(rangeDate.getDate() - parseInt(timeRange));
        query.measureTime.$gte = rangeDate;
      }
    }

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await BloodPressure.find(query)
      .sort({ measureTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 总数统计
    const total = await BloodPressure.countDocuments(query);

    // 获取统计数据
    const stats = await BloodPressure.getUserStats(userId, parseInt(timeRange));

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        stats: stats || { totalRecords: 0, timeRange: parseInt(timeRange) }
      },
      message: '获取血压记录成功'
    });

  } catch (error) {
    console.error('获取血压记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取血压记录失败',
      code: 'GET_BP_RECORDS_ERROR'
    });
  }
});

/**
 * 创建血压记录
 * POST /api/v1/blood-pressure
 */
router.post('/', async (req, res) => {
  try {
    const {
      systolic,
      diastolic,
      measureTime,
      context,
      notes,
      source = 'manual'
    } = req.body;

    // 数据验证
    if (!systolic || !diastolic) {
      return res.status(400).json({
        success: false,
        error: '收缩压和舒张压不能为空',
        code: 'MISSING_BP_DATA'
      });
    }

    if (systolic <= diastolic) {
      return res.status(400).json({
        success: false,
        error: '收缩压必须大于舒张压',
        code: 'INVALID_BP_DATA'
      });
    }

    // 开发模式：返回简化响应
    if (database.isDevelopment()) {
      const mockRecord = {
        _id: 'bp_' + Date.now(),
        userId: 'user_' + Date.now(),
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        measureTime: measureTime ? new Date(measureTime) : new Date(),
        context: context || { timeOfDay: 'morning', beforeMeasure: { activity: 'rest', emotion: 'calm' } },
        notes: notes || '',
        source,
        classification: {
          level: systolic < 130 && diastolic < 85 ? 'normal' : 'high_normal',
          name: systolic < 130 && diastolic < 85 ? '正常血压' : '正常高值',
          color: systolic < 130 && diastolic < 85 ? '#1890ff' : '#faad14'
        },
        pulsePressure: systolic - diastolic,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return res.status(201).json({
        success: true,
        data: mockRecord,
        message: '血压记录保存成功（开发模式）'
      });
    }

    // TODO: 从token中获取用户ID
    const userId = req.headers.authorization || 'temp_user_id';

    // 创建记录
    const bloodPressure = new BloodPressure({
      userId,
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      measureTime: measureTime ? new Date(measureTime) : new Date(),
      context,
      notes,
      source
    });

    await bloodPressure.save();

    // 更新用户统计信息
    const user = await User.findById(userId);
    if (user) {
      await user.updateStats();
    }

    res.status(201).json({
      success: true,
      data: bloodPressure,
      message: '血压记录创建成功'
    });

  } catch (error) {
    console.error('创建血压记录失败:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: '数据验证失败',
        details: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: '创建血压记录失败',
      code: 'CREATE_BP_RECORD_ERROR'
    });
  }
});

/**
 * 获取单条血压记录
 * GET /api/v1/blood-pressure/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开发模式
    if (database.isDevelopment()) {
      return res.status(404).json({
        success: false,
        error: '记录不存在',
        code: 'RECORD_NOT_FOUND'
      });
    }

    const record = await BloodPressure.findById(id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: '血压记录不存在',
        code: 'BP_RECORD_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: record,
      message: '获取血压记录成功'
    });

  } catch (error) {
    console.error('获取血压记录失败:', error);
    res.status(500).json({
      success: false,
      error: '获取血压记录失败',
      code: 'GET_BP_RECORD_ERROR'
    });
  }
});

/**
 * 更新血压记录
 * PUT /api/v1/blood-pressure/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 开发模式
    if (database.isDevelopment()) {
      const mockRecord = generateMockData(1)[0];
      mockRecord._id = id;
      Object.assign(mockRecord, updateData);
      mockRecord.updatedAt = new Date();

      return res.json({
        success: true,
        data: mockRecord,
        message: '血压记录更新成功（开发模式）'
      });
    }

    const record = await BloodPressure.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '血压记录不存在',
        code: 'BP_RECORD_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: record,
      message: '血压记录更新成功'
    });

  } catch (error) {
    console.error('更新血压记录失败:', error);
    res.status(500).json({
      success: false,
      error: '更新血压记录失败',
      code: 'UPDATE_BP_RECORD_ERROR'
    });
  }
});

/**
 * 删除血压记录
 * DELETE /api/v1/blood-pressure/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开发模式
    if (database.isDevelopment()) {
      return res.json({
        success: true,
        message: '血压记录删除成功（开发模式）'
      });
    }

    const record = await BloodPressure.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: '血压记录不存在',
        code: 'BP_RECORD_NOT_FOUND'
      });
    }

    // 更新用户统计信息
    const user = await User.findById(record.userId);
    if (user) {
      await user.updateStats();
    }

    res.json({
      success: true,
      message: '血压记录删除成功'
    });

  } catch (error) {
    console.error('删除血压记录失败:', error);
    res.status(500).json({
      success: false,
      error: '删除血压记录失败',
      code: 'DELETE_BP_RECORD_ERROR'
    });
  }
});

/**
 * 获取血压统计数据
 * GET /api/v1/blood-pressure/stats/summary?timeRange=30
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;

    // 开发模式：返回空统计数据
    if (database.isDevelopment()) {
      return res.json({
        success: true,
        data: {
          totalRecords: 0,
          timeRange: parseInt(timeRange),
          averages: {
            systolic: null,
            diastolic: null
          },
          ranges: {
            systolic: { min: null, max: null },
            diastolic: { min: null, max: null }
          },
          distribution: {
            optimal: 0,
            normal: 0,
            high_normal: 0,
            mild_hypertension: 0,
            moderate_hypertension: 0,
            severe_hypertension: 0
          },
          trends: {
            systolic_trend: 'stable',
            diastolic_trend: 'stable'
          }
        },
        message: '暂无统计数据（开发模式）'
      });
    }

    // TODO: 从token中获取用户ID
    const userId = req.headers.authorization || 'temp_user_id';
    
    const stats = await BloodPressure.getUserStats(userId, parseInt(timeRange));

    if (!stats) {
      return res.json({
        success: true,
        data: {
          totalRecords: 0,
          timeRange: parseInt(timeRange),
          message: '暂无血压记录'
        }
      });
    }

    res.json({
      success: true,
      data: stats,
      message: '获取统计数据成功'
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      code: 'GET_BP_STATS_ERROR'
    });
  }
});

module.exports = router;