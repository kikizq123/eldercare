const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  openId: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['elder', 'family'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: String,
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  familyMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 