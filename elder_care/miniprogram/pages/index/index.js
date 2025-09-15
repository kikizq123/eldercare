Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    healthData: [],
    medications: []
  },

  onLoad: function () {
    console.log('Index page onLoad');
    
    // 开发调试用：清除所有存储，取消注释即可使用
    // this.clearAllStorage();
    
    this.checkUserStatus();
  },

  // 检查用户状态
  checkUserStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const role = wx.getStorageSync('role');
    
    console.log('检查用户状态:', { userInfo: !!userInfo, role });

    if (!userInfo || !userInfo._id) {
      // 未登录，跳转到角色选择页（会触发登录）
      console.log('用户未登录，跳转到角色选择页');
      wx.reLaunch({
        url: '/pages/role/index'
      });
      return;
    }

    if (!role) {
      // 已登录但未选择角色
      console.log('用户已登录但未选择角色，跳转到角色选择页');
      wx.reLaunch({
        url: '/pages/role/index'
      });
      return;
    }

    // 用户已登录且已选择角色，正常加载页面
    console.log('用户状态正常，加载页面数据');
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
    this.loadData();
  },

  loadData: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;

    // 加载健康数据
    wx.request({
      url: getApp().globalData.baseUrl + '/health/latest',
      method: 'GET',
      data: {
        userId: userInfo._id
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            healthData: res.data.data || []
          });
        }
      },
      fail: () => {
        // 失败时显示模拟数据
        this.setData({
          healthData: this.getMockHealthData()
        });
      }
    });

    // 加载今日用药提醒
    wx.request({
      url: getApp().globalData.baseUrl + '/medication/today',
      method: 'GET',
      data: {
        userId: userInfo._id
      },
      success: (res) => {
        if (res.data.success) {
          const medications = res.data.data || [];
          const today = new Date().toISOString().split('T')[0];
          
          // 处理服用状态
          const processedMeds = medications.map(item => {
            const takenRecords = item.takenRecords || [];
            const todayRecord = takenRecords.find(record => record.date === today);
            const takenToday = todayRecord ? todayRecord.taken : false;
            
            return { 
              ...item, 
              takenToday,
              displayTimes: Array.isArray(item.times) ? item.times.join(' / ') : item.times
            };
          });
          
          this.setData({
            medications: processedMeds
          });
        }
      },
      fail: () => {
        // 失败时显示模拟数据
        this.setData({
          medications: this.getMockMedications()
        });
      }
    });
  },

  // 获取模拟健康数据
  getMockHealthData: function() {
    return [
      {
        type: 'bloodPressure',
        value: '120/80',
        unit: 'mmHg',
        timestamp: new Date(),
        isNormal: true
      },
      {
        type: 'bloodSugar',
        value: '5.6',
        unit: 'mmol/L',
        timestamp: new Date(),
        isNormal: true
      }
    ];
  },

  // 获取模拟用药数据
  getMockMedications: function() {
    return [
      {
        _id: 'mock1',
        name: '降压药',
        dosage: '1片',
        displayTimes: '早上 / 晚上',
        takenToday: false
      },
      {
        _id: 'mock2',
        name: '维生素D',
        dosage: '2粒',
        displayTimes: '早上',
        takenToday: true
      }
    ];
  },

  getUserInfo: function(e) {
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    });
    wx.setStorageSync('userInfo', e.detail.userInfo);
  },

  // SOS功能
  handleSOS: function() {
    wx.showModal({
      title: '紧急求助',
      content: '确定要发送紧急求助信号吗？',
      success: (res) => {
        if (res.confirm) {
          // 开发阶段直接显示成功提示，不发送请求
          console.log('SOS triggered (mock)');
          wx.showToast({
            title: '求助信号已发送',
            icon: 'success'
          });
          
          /* 真实请求代码，开发完成后可以启用
          const baseUrl = getApp().globalData.baseUrl || 'http://localhost:3000/api';
          wx.request({
            url: baseUrl + '/users/sos',
            method: 'POST',
            success: () => {
              wx.showToast({
                title: '求助信号已发送',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('Failed to send SOS:', err);
              wx.showToast({
                title: '发送失败，请重试',
                icon: 'none'
              });
            }
          });
          */
        }
      }
    });
  },

  // 清除所有本地存储（开发调试用）
  clearAllStorage: function() {
    console.log('Clearing all storage');
    wx.clearStorageSync();
    console.log('All storage cleared');
  },

  // 重置应用（开发调试用）
  resetApp: function() {
    wx.showModal({
      title: '重置应用',
      content: '确定要重置应用状态吗？这将清除所有本地数据。',
      success: (res) => {
        if (res.confirm) {
          this.clearAllStorage();
          wx.showToast({ 
            title: '已重置', 
            icon: 'success',
            duration: 1000
          });
          
          // 延迟1秒后直接跳转到角色选择页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/role/index' });
          }, 1000);
        }
      }
    });
  }
}); 