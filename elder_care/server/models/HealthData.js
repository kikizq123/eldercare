const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['bloodPressure', 'bloodSugar', 'weight', 'temperature'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // 支持字符串和数字，用于血压等复合数据
    required: true
  },
  unit: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  // 新增字段
  measurementType: {
    type: String, // 如血糖的 'fasting'（空腹）、'postmeal'（餐后）等
    default: 'normal'
  },
  isAbnormal: {
    type: Boolean,
    default: false
  },
  abnormalReason: String, // 异常原因说明
  recordedBy: {
    type: String,
    enum: ['self', 'family', 'caregiver'],
    default: 'self'
  }
});

module.exports = mongoose.model('HealthData', healthDataSchema); 