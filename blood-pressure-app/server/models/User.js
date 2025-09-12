const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 微信相关信息
  openId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  unionId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // 用户基本信息
  nickname: {
    type: String,
    required: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // 用户设置
  settings: {
    // 血压正常范围设置（用户可自定义）
    normalRange: {
      systolic: {
        min: { type: Number, default: 90 },
        max: { type: Number, default: 140 }
      },
      diastolic: {
        min: { type: Number, default: 60 },
        max: { type: Number, default: 90 }
      }
    },
    
    // 提醒设置
    reminders: {
      enabled: { type: Boolean, default: false },
      times: [{ type: String }] // 格式: "08:00", "18:00"
    },
    
    // 隐私设置
    dataSharing: {
      enabled: { type: Boolean, default: false }
    }
  },
  
  // 统计信息
  stats: {
    totalRecords: { type: Number, default: 0 },
    lastRecordDate: { type: Date },
    averageSystolic: { type: Number },
    averageDiastolic: { type: Number }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：用户状态
userSchema.virtual('status').get(function() {
  const now = new Date();
  const lastRecord = this.stats.lastRecordDate;
  
  if (!lastRecord) return 'new';
  
  const daysDiff = Math.floor((now - lastRecord) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) return 'active';
  if (daysDiff <= 7) return 'regular';
  return 'inactive';
});

// 实例方法：更新统计信息
userSchema.methods.updateStats = async function(bloodPressureData) {
  const BloodPressure = mongoose.model('BloodPressure');
  
  // 计算总记录数
  this.stats.totalRecords = await BloodPressure.countDocuments({ userId: this._id });
  
  // 更新最后记录时间
  this.stats.lastRecordDate = new Date();
  
  // 计算平均值（最近30条记录）
  const recentRecords = await BloodPressure.find({ userId: this._id })
    .sort({ measureTime: -1 })
    .limit(30)
    .select('systolic diastolic');
  
  if (recentRecords.length > 0) {
    const avgSystolic = recentRecords.reduce((sum, record) => sum + record.systolic, 0) / recentRecords.length;
    const avgDiastolic = recentRecords.reduce((sum, record) => sum + record.diastolic, 0) / recentRecords.length;
    
    this.stats.averageSystolic = Math.round(avgSystolic);
    this.stats.averageDiastolic = Math.round(avgDiastolic);
  }
  
  await this.save();
};

// 静态方法：根据openId查找或创建用户
userSchema.statics.findOrCreateByOpenId = async function(openId, userInfo = {}) {
  let user = await this.findOne({ openId });
  
  if (!user) {
    user = await this.create({
      openId,
      nickname: userInfo.nickname || '用户',
      avatar: userInfo.avatar || ''
    });
  }
  
  return user;
};

// 索引优化
userSchema.index({ 'stats.lastRecordDate': -1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);