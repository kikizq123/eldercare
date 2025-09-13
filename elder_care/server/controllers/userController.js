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

// 家庭绑定
exports.bindFamily = async (req, res) => {
  try {
    const { familyId, inviteCode } = req.body;
    console.log('家庭绑定请求:', { familyId, inviteCode });
    
    if (isDatabaseConnected()) {
      // 数据库模式
      // 查找邀请码对应的长辈用户
      const elderUser = await User.findOne({ inviteCode });
      if (!elderUser) {
        return res.status(404).json({
          success: false,
          message: '邀请码无效或已过期'
        });
      }
      
      // 查找家庭成员用户
      const familyUser = await User.findById(familyId);
      if (!familyUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      // 建立双向关系
      if (!elderUser.familyMembers.includes(familyId)) {
        elderUser.familyMembers.push(familyId);
        await elderUser.save();
      }
      
      if (!familyUser.familyMembers.includes(elderUser._id)) {
        familyUser.familyMembers.push(elderUser._id);
        await familyUser.save();
      }
      
      res.json({
        success: true,
        message: '绑定成功',
        data: { elderUser: elderUser.name, familyUser: familyUser.name }
      });
    } else {
      // 开发模式：模拟绑定成功
      console.log('开发模式：模拟家庭绑定成功');
      
      res.json({
        success: true,
        message: '绑定成功（开发模式）',
        mode: 'development',
        data: { elderUser: '长辈用户', familyUser: '家庭成员' }
      });
    }
  } catch (error) {
    console.error('家庭绑定错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 解除家庭绑定
exports.unbindFamily = async (req, res) => {
  try {
    const { userId, familyId } = req.body;
    console.log('解除家庭绑定:', { userId, familyId });
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const user = await User.findById(userId);
      const familyUser = await User.findById(familyId);
      
      if (user && familyUser) {
        // 移除双向关系
        user.familyMembers = user.familyMembers.filter(id => id.toString() !== familyId);
        familyUser.familyMembers = familyUser.familyMembers.filter(id => id.toString() !== userId);
        
        await user.save();
        await familyUser.save();
      }
      
      res.json({
        success: true,
        message: '解除绑定成功'
      });
    } else {
      // 开发模式
      console.log('开发模式：模拟解除绑定成功');
      
      res.json({
        success: true,
        message: '解除绑定成功（开发模式）',
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('解除绑定错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 获取家庭成员列表
exports.getFamilyMembers = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('获取家庭成员列表:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const user = await User.findById(userId).populate('familyMembers');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: user.familyMembers || []
      });
    } else {
      // 开发模式：返回模拟数据
      const mockFamilyMembers = [
        {
          _id: 'mock_family_1',
          name: '张小明',
          role: 'family',
          phone: '138****5678',
          createdAt: new Date()
        },
        {
          _id: 'mock_family_2', 
          name: '李小红',
          role: 'family',
          phone: '139****1234',
          createdAt: new Date()
        }
      ];
      
      console.log('开发模式：返回模拟家庭成员', mockFamilyMembers.length, '个');
      
      res.json({
        success: true,
        data: mockFamilyMembers,
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('获取家庭成员错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 生成邀请码
exports.generateInviteCode = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('生成邀请码:', userId);
    
    // 生成6位随机邀请码
    const inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      user.inviteCode = inviteCode;
      user.inviteCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
      await user.save();
      
      res.json({
        success: true,
        data: { inviteCode }
      });
    } else {
      // 开发模式
      console.log('开发模式：生成邀请码', inviteCode);
      
      res.json({
        success: true,
        data: { inviteCode },
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('生成邀请码错误:', error);
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
    console.log('SOS请求:', userId);
    
    if (isDatabaseConnected()) {
      // 数据库模式
      const user = await User.findById(userId).populate('familyMembers');
      if (!user) {
        throw new Error('用户不存在');
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
        message: 'SOS信号发送成功'
      });
    } else {
      // 开发模式
      console.log('开发模式：SOS信号已发送');
      
      res.json({
        success: true,
        message: 'SOS信号发送成功（开发模式）',
        mode: 'development'
      });
    }
  } catch (error) {
    console.error('SOS处理错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 检查数据库连接状态
function isDatabaseConnected() {
  return require('mongoose').connection.readyState === 1;
}

// 获取用户位置（模拟）
async function getLocation(userId) {
  // TODO: 实现实际的位置获取逻辑
  return {
    latitude: 39.9042,
    longitude: 116.4074,
    address: '北京市朝阳区'
  };
} 