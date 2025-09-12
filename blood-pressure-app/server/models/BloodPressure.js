const mongoose = require('mongoose');

const bloodPressureSchema = new mongoose.Schema({
  // 关联用户
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 血压数据
  systolic: {
    type: Number,
    required: true,
    min: [60, '收缩压不能低于60mmHg'],
    max: [300, '收缩压不能高于300mmHg']
  },
  diastolic: {
    type: Number,
    required: true,
    min: [30, '舒张压不能低于30mmHg'],
    max: [200, '舒张压不能高于200mmHg']
  },
  
  // 测量信息
  measureTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // 测量环境和状态
  context: {
    // 测量时间段
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: function() {
        const hour = this.measureTime.getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        if (hour < 22) return 'evening';
        return 'night';
      }
    },
    
    // 测量前状态
    beforeMeasure: {
      activity: {
        type: String,
        enum: ['rest', 'light_activity', 'exercise', 'work', 'other'],
        default: 'rest'
      },
      emotion: {
        type: String,
        enum: ['calm', 'stressed', 'anxious', 'happy', 'tired'],
        default: 'calm'
      }
    }
  },
  
  // 备注信息
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  },
  
  // 数据来源
  source: {
    type: String,
    enum: ['manual', 'device', 'import'],
    default: 'manual'
  },
  
  // 设备信息（如果是设备测量）
  device: {
    name: String,
    model: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：血压分级
bloodPressureSchema.virtual('classification').get(function() {
  const systolic = this.systolic;
  const diastolic = this.diastolic;
  
  // 根据中国高血压防治指南标准
  if (systolic < 120 && diastolic < 80) {
    return {
      level: 'optimal',
      name: '理想血压',
      color: '#52c41a',
      description: '血压正常，继续保持健康生活方式'
    };
  }
  
  if (systolic < 130 && diastolic < 85) {
    return {
      level: 'normal',
      name: '正常血压',
      color: '#1890ff',
      description: '血压正常范围内'
    };
  }
  
  if (systolic < 140 && diastolic < 90) {
    return {
      level: 'high_normal',
      name: '正常高值',
      color: '#faad14',
      description: '建议调整生活方式，定期监测'
    };
  }
  
  if (systolic < 160 && diastolic < 100) {
    return {
      level: 'mild_hypertension',
      name: '1级高血压',
      color: '#fa8c16',
      description: '建议就医咨询，调整生活方式'
    };
  }
  
  if (systolic < 180 && diastolic < 110) {
    return {
      level: 'moderate_hypertension',
      name: '2级高血压',
      color: '#f5222d',
      description: '请及时就医，需要药物治疗'
    };
  }
  
  return {
    level: 'severe_hypertension',
    name: '3级高血压',
    color: '#a8071a',
    description: '请立即就医！需要紧急处理'
  };
});

// 虚拟字段：脉压差
bloodPressureSchema.virtual('pulsePressure').get(function() {
  return this.systolic - this.diastolic;
});

// 虚拟字段：平均动脉压
bloodPressureSchema.virtual('meanArterialPressure').get(function() {
  return Math.round(this.diastolic + (this.systolic - this.diastolic) / 3);
});

// 数据验证：收缩压必须大于舒张压
bloodPressureSchema.pre('validate', function() {
  if (this.systolic <= this.diastolic) {
    this.invalidate('systolic', '收缩压必须大于舒张压');
  }
  
  // 检查测量时间不能是未来时间
  if (this.measureTime > new Date()) {
    this.invalidate('measureTime', '测量时间不能是未来时间');
  }
});

// 实例方法：检查是否异常
bloodPressureSchema.methods.isAbnormal = function(userSettings = {}) {
  const normalRange = userSettings.normalRange || {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 }
  };
  
  return (
    this.systolic < normalRange.systolic.min ||
    this.systolic > normalRange.systolic.max ||
    this.diastolic < normalRange.diastolic.min ||
    this.diastolic > normalRange.diastolic.max
  );
};

// 静态方法：获取用户统计数据
bloodPressureSchema.statics.getUserStats = async function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        measureTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        avgSystolic: { $avg: '$systolic' },
        avgDiastolic: { $avg: '$diastolic' },
        maxSystolic: { $max: '$systolic' },
        maxDiastolic: { $max: '$diastolic' },
        minSystolic: { $min: '$systolic' },
        minDiastolic: { $min: '$diastolic' },
        records: { $push: '$$ROOT' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

// 复合索引优化查询
bloodPressureSchema.index({ userId: 1, measureTime: -1 });
bloodPressureSchema.index({ userId: 1, createdAt: -1 });
bloodPressureSchema.index({ measureTime: -1 });

module.exports = mongoose.model('BloodPressure', bloodPressureSchema);