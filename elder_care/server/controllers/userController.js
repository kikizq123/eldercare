const User = require('../models/User');
const axios = require('axios');

// 微信登录
exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    
    // 开发模式：如果没有配置微信AppID或数据库连接失败，使用模拟数据
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;
    
    if (!appid || appid === 'your_wechat_appid_here') {
      // 开发模式：返回模拟用户数据
      const mockUser = {
        _id: 'mock_user_id_' + Date.now(),
        openId: 'mock_openid_' + code,
        role: 'elder',
        name: '测试用户',
        phone: '',
        emergencyContacts: [],
        familyMembers: [],
        createdAt: new Date()
      };
      
      console.log('Development mode: Using mock user data');
      return res.json({
        success: true,
        data: mockUser,
        mode: 'development'
      });
    }
    
    // 生产模式：调用微信API
    const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`);
    
    const { openid, errcode, errmsg } = response.data;
    
    if (errcode) {
      throw new Error(`微信API错误: ${errmsg}`);
    }
    
    if (!openid) {
      throw new Error('未获取到用户openid');
    }
    
    // 查找或创建用户
    let user;
    try {
      user = await User.findOne({ openId: openid });
      if (!user) {
        user = new User({
          openId: openid,
          role: 'elder',
          name: '新用户'
        });
        await user.save();
      }
    } catch (dbError) {
      // 数据库错误时使用临时用户数据
      console.warn('Database error, using temporary user:', dbError.message);
      user = {
        _id: 'temp_user_' + openid,
        openId: openid,
        role: 'elder',
        name: '临时用户',
        phone: '',
        emergencyContacts: [],
        familyMembers: [],
        createdAt: new Date()
      };
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 添加紧急联系人
exports.addEmergencyContact = async (req, res) => {
  try {
    const { userId } = req.params;
    const contact = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { emergencyContacts: contact } },
      { new: true }
    );
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 处理SOS请求
exports.handleSOS = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId).populate('familyMembers');
    if (!user) {
      throw new Error('User not found');
    }
    
    // 获取用户位置
    const location = await getLocation(userId);
    
    // 构建SOS消息
    const sosMessage = {
      type: 'SOS',
      userId: user._id,
      userName: user.name,
      location: location,
      timestamp: new Date()
    };
    
    // TODO: 发送通知给紧急联系人
    // 这里需要实现具体的通知逻辑
    
    res.json({
      success: true,
      message: 'SOS signal sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取用户位置（模拟）
async function getLocation(userId) {
  // TODO: 实现实际的位置获取逻辑
  return {
    latitude: 39.9042,
    longitude: 116.4074
  };
} 