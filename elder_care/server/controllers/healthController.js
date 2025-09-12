const HealthData = require('../models/HealthData');
const mongoose = require('mongoose');

// 模拟数据存储（开发模式使用）
let mockHealthData = [];
let mockIdCounter = 1;

// 检查数据库连接状态
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// 添加健康数据
exports.addHealthData = async (req, res) => {
  try {
    console.log('接收到健康数据提交:', req.body);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const healthData = new HealthData(req.body);
      await healthData.save();
      
      res.json({
        success: true,
        data: healthData
      });
    } else {
      // 开发模式：使用内存存储
      const mockData = {
        _id: 'mock_health_' + mockIdCounter++,
        ...req.body,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 验证必要字段
      if (!mockData.type || !mockData.value) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段：type 或 value'
        });
      }
      
      mockHealthData.push(mockData);
      
      console.log('开发模式：健康数据已保存', mockData);
      
      res.json({
        success: true,
        data: mockData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('健康数据添加错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取最新健康数据
exports.getLatestHealthData = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('获取最新健康数据, userId:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const data = await HealthData.find({ userId })
        .sort({ timestamp: -1 })
        .limit(10);
      
      res.json({
        success: true,
        data
      });
    } else {
      // 开发模式：返回模拟数据
      const filteredData = mockHealthData
        .filter(item => !userId || item.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      console.log('开发模式：返回最新健康数据', filteredData.length, '条');
      
      res.json({
        success: true,
        data: filteredData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取健康数据错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取健康数据趋势
exports.getHealthTrend = async (req, res) => {
  try {
    const { userId, type, startDate, endDate } = req.query;
    console.log('获取健康数据趋势:', { userId, type, startDate, endDate });
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const data = await HealthData.find({
        userId,
        type,
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).sort({ timestamp: 1 });
      
      res.json({
        success: true,
        data
      });
    } else {
      // 开发模式：返回模拟数据
      let filteredData = mockHealthData.filter(item => {
        if (userId && item.userId !== userId) return false;
        if (type && item.type !== type) return false;
        
        if (startDate || endDate) {
          const itemDate = new Date(item.timestamp);
          if (startDate && itemDate < new Date(startDate)) return false;
          if (endDate && itemDate > new Date(endDate)) return false;
        }
        
        return true;
      }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log('开发模式：返回趋势数据', filteredData.length, '条');
      
      res.json({
        success: true,
        data: filteredData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取健康趋势错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 