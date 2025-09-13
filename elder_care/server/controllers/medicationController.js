const Medication = require('../models/Medication');
const mongoose = require('mongoose');

// 模拟数据存储（开发模式使用）
let mockMedications = [];
let mockIdCounter = 1;

// 检查数据库连接状态
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// 添加用药计划
exports.addMedication = async (req, res) => {
  try {
    console.log('接收到用药计划添加请求:', req.body);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const medication = new Medication(req.body);
      await medication.save();
      
      res.json({
        success: true,
        data: medication
      });
    } else {
      // 开发模式：使用内存存储
      const mockData = {
        _id: 'mock_med_' + mockIdCounter++,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 验证必要字段
      if (!mockData.name || !mockData.dosage || !mockData.times) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段：name、dosage 或 times'
        });
      }
      
      mockMedications.push(mockData);
      
      console.log('开发模式：用药计划已保存', mockData);
      
      res.json({
        success: true,
        data: mockData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('用药计划添加错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取用户的所有用药计划
exports.getUserMedications = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('获取用药计划, userId:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const medications = await Medication.find({ userId })
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: medications
      });
    } else {
      // 开发模式：返回模拟数据
      const filteredData = mockMedications
        .filter(item => !userId || item.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('开发模式：返回用药计划', filteredData.length, '条');
      
      res.json({
        success: true,
        data: filteredData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取用药计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取今日用药计划
exports.getTodayMedications = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('获取今日用药计划, userId:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const medications = await Medication.find({
        userId,
        startDate: { $lte: today },
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: today } }
        ]
      });
      
      res.json({
        success: true,
        data: medications
      });
    } else {
      // 开发模式：返回所有用药计划
      const filteredData = mockMedications
        .filter(item => !userId || item.userId === userId);
      
      console.log('开发模式：返回今日用药计划', filteredData.length, '条');
      
      res.json({
        success: true,
        data: filteredData,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取今日用药计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 更新用药计划
exports.updateMedication = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('更新用药计划:', id, req.body);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const medication = await Medication.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true }
      );
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: '用药计划不存在'
        });
      }
      
      res.json({
        success: true,
        data: medication
      });
    } else {
      // 开发模式
      const index = mockMedications.findIndex(item => item._id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: '用药计划不存在'
        });
      }
      
      mockMedications[index] = {
        ...mockMedications[index],
        ...req.body,
        updatedAt: new Date()
      };
      
      console.log('开发模式：用药计划已更新', mockMedications[index]);
      
      res.json({
        success: true,
        data: mockMedications[index],
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('更新用药计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 删除用药计划
exports.deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('删除用药计划:', id);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const medication = await Medication.findByIdAndDelete(id);
      
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: '用药计划不存在'
        });
      }
      
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      // 开发模式
      const index = mockMedications.findIndex(item => item._id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: '用药计划不存在'
        });
      }
      
      mockMedications.splice(index, 1);
      
      console.log('开发模式：用药计划已删除');
      
      res.json({
        success: true,
        message: '删除成功',
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('删除用药计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 标记用药已服用
exports.markTaken = async (req, res) => {
  try {
    const { medicationId, taken, date } = req.body;
    console.log('标记用药状态:', { medicationId, taken, date });
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const medication = await Medication.findById(medicationId);
      if (!medication) {
        throw new Error('用药计划不存在');
      }
      
      // 更新服用记录
      const takenDate = date || new Date().toISOString().split('T')[0];
      if (!medication.takenRecords) {
        medication.takenRecords = [];
      }
      
      const existingRecord = medication.takenRecords.find(record => 
        record.date === takenDate
      );
      
      if (existingRecord) {
        existingRecord.taken = taken;
        existingRecord.timestamp = new Date();
      } else {
        medication.takenRecords.push({
          date: takenDate,
          taken: taken,
          timestamp: new Date()
        });
      }
      
      await medication.save();
      
      res.json({
        success: true,
        data: medication
      });
    } else {
      // 开发模式
      const index = mockMedications.findIndex(item => item._id === medicationId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: '用药计划不存在'
        });
      }
      
      const takenDate = date || new Date().toISOString().split('T')[0];
      if (!mockMedications[index].takenRecords) {
        mockMedications[index].takenRecords = [];
      }
      
      const existingRecord = mockMedications[index].takenRecords.find(record => 
        record.date === takenDate
      );
      
      if (existingRecord) {
        existingRecord.taken = taken;
        existingRecord.timestamp = new Date();
      } else {
        mockMedications[index].takenRecords.push({
          date: takenDate,
          taken: taken,
          timestamp: new Date()
        });
      }
      
      console.log('开发模式：用药状态已更新', mockMedications[index]);
      
      res.json({
        success: true,
        data: mockMedications[index],
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('标记用药状态错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 