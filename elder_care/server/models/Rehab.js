const mongoose = require('mongoose');

// 康复项目模式
const rehabExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  targetCount: {
    type: Number, // 目标次数
    default: 1
  },
  targetDuration: {
    type: Number, // 目标时长（分钟）
    default: 0
  },
  targetSets: {
    type: Number, // 目标组数
    default: 1
  },
  instructions: String, // 动作说明
  imageUrl: String, // 示范图片
  videoUrl: String, // 教学视频
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  }
});

// 康复计划模式
const rehabPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  exercises: [rehabExerciseSchema],
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily'
    },
    daysOfWeek: [{ // 一周中的哪几天 0-6 (周日-周六)
      type: Number,
      min: 0,
      max: 6
    }],
    timeSlots: [String] // 时间段，如 ['09:00', '15:00']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 康复记录模式
const rehabRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  exerciseName: String, // 冗余字段，便于查询
  date: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  actualCount: {
    type: Number,
    default: 0
  },
  actualDuration: {
    type: Number,
    default: 0
  },
  actualSets: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['too-easy', 'just-right', 'too-hard'],
    default: 'just-right'
  },
  feeling: {
    type: String,
    enum: ['great', 'good', 'okay', 'tired', 'painful'],
    default: 'okay'
  },
  notes: String,
  completedAt: Date
});

// 更新时间中间件
rehabPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RehabPlan = mongoose.model('RehabPlan', rehabPlanSchema);
const RehabRecord = mongoose.model('RehabRecord', rehabRecordSchema);

module.exports = {
  RehabPlan,
  RehabRecord
};