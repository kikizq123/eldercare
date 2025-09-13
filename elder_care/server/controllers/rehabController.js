const { RehabPlan, RehabRecord } = require('../models/Rehab');
const User = require('../models/User');
const mongoose = require('mongoose');

// 模拟数据存储（开发模式使用）
let mockRehabPlans = [];
let mockRehabRecords = [];
let mockIdCounter = 1;

// 检查数据库连接状态
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// 创建康复计划
exports.createPlan = async (req, res) => {
  try {
    const { userId, name, frequency, notes } = req.body;
    console.log('创建康复计划:', req.body);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const plan = new RehabPlan({
        userId,
        name,
        frequency,
        notes,
        createdBy: userId
      });
      
      await plan.save();
      
      res.json({
        success: true,
        data: plan
      });
    } else {
      // 开发模式：使用内存存储
      const mockPlan = {
        _id: 'mock_rehab_' + mockIdCounter++,
        userId,
        name,
        frequency,
        notes: notes || '',
        checkins: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 验证必要字段
      if (!mockPlan.name || !mockPlan.frequency) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段：name 或 frequency'
        });
      }
      
      mockRehabPlans.push(mockPlan);
      
      console.log('开发模式：康复计划已保存', mockPlan);
      
      res.json({
        success: true,
        data: mockPlan,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('创建康复计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取用户的康复计划列表
exports.getUserPlans = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('获取康复计划列表, userId:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const plans = await RehabPlan.find({ 
        userId,
        isActive: true 
      }).sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: plans
      });
    } else {
      // 开发模式：返回模拟数据
      const filteredPlans = mockRehabPlans
        .filter(plan => !userId || plan.userId === userId)
        .filter(plan => plan.isActive !== false)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('开发模式：返回康复计划', filteredPlans.length, '个');
      
      res.json({
        success: true,
        data: filteredPlans,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取康复计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取康复计划详情
exports.getPlanDetail = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await RehabPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 更新康复计划
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;
    
    const plan = await RehabPlan.findByIdAndUpdate(
      planId,
      updateData,
      { new: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 删除康复计划（软删除）
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await RehabPlan.findByIdAndUpdate(
      planId,
      { isActive: false },
      { new: true }
    );
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 康复打卡
exports.checkin = async (req, res) => {
  try {
    const { planId, userId, checked, date } = req.body;
    console.log('康复打卡:', { planId, userId, checked, date });
    
    if (isDatabaseConnected()) {
      // 数据库模式
      // 这里可以实现更复杂的打卡逻辑
      res.json({
        success: true,
        message: checked ? '打卡成功' : '取消打卡成功'
      });
    } else {
      // 开发模式：更新模拟数据
      const planIndex = mockRehabPlans.findIndex(plan => plan._id === planId);
      if (planIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '康复计划不存在'
        });
      }
      
      const checkinDate = date || new Date().toISOString().split('T')[0];
      let checkins = mockRehabPlans[planIndex].checkins || [];
      
      if (checked) {
        // 添加打卡记录
        if (!checkins.includes(checkinDate)) {
          checkins.push(checkinDate);
        }
      } else {
        // 移除打卡记录
        checkins = checkins.filter(d => d !== checkinDate);
      }
      
      mockRehabPlans[planIndex].checkins = checkins;
      mockRehabPlans[planIndex].updatedAt = new Date();
      
      console.log('开发模式：打卡状态已更新', mockRehabPlans[planIndex]);
      
      res.json({
        success: true,
        message: checked ? '打卡成功' : '取消打卡成功',
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('康复打卡错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 删除康复计划
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('删除康复计划:', id);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const plan = await RehabPlan.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: '康复计划不存在'
        });
      }
      
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      // 开发模式
      const planIndex = mockRehabPlans.findIndex(plan => plan._id === id);
      if (planIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '康复计划不存在'
        });
      }
      
      mockRehabPlans.splice(planIndex, 1);
      
      console.log('开发模式：康复计划已删除');
      
      res.json({
        success: true,
        message: '删除成功',
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('删除康复计划错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取康复记录
exports.getRecords = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planId, date, limit = 50 } = req.query;
    
    let query = { userId };
    
    if (planId) {
      query.planId = planId;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const records = await RehabRecord.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('planId', 'name');
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取今日康复任务
exports.getTodayTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 获取用户的活跃康复计划
    const plans = await RehabPlan.find({
      userId,
      isActive: true
    });
    
    // 获取今日已完成的记录
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayRecords = await RehabRecord.find({
      userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // 构建今日任务列表
    const tasks = [];
    const todayDay = new Date().getDay(); // 0-6 (周日-周六)
    
    plans.forEach(plan => {
      // 检查计划是否在今天执行
      const shouldExecuteToday = plan.schedule.frequency === 'daily' || 
        (plan.schedule.frequency === 'weekly' && plan.schedule.daysOfWeek.includes(todayDay));
      
      if (shouldExecuteToday) {
        plan.exercises.forEach(exercise => {
          const existingRecord = todayRecords.find(record => 
            record.planId.toString() === plan._id.toString() && 
            record.exerciseId.toString() === exercise._id.toString()
          );
          
          tasks.push({
            planId: plan._id,
            planName: plan.name,
            exerciseId: exercise._id,
            exerciseName: exercise.name,
            exercise,
            completed: !!existingRecord,
            record: existingRecord || null
          });
        });
      }
    });
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取康复统计数据
exports.getStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '7' } = req.query; // 默认7天
    
    const days = parseInt(period);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 获取期间内的记录
    const records = await RehabRecord.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // 计算统计数据
    const totalTasks = records.length;
    const completedTasks = records.filter(r => r.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    
    // 按日期分组统计
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        total: 0,
        completed: 0
      };
    }
    
    records.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].total++;
        if (record.completed) {
          dailyStats[dateStr].completed++;
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        completionRate,
        dailyStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};