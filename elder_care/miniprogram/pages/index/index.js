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
    
    const role = wx.getStorageSync('role');
    console.log('Current role:', role);
    
    if (wx.getStorageSync('userInfo')) {
      this.setData({
        userInfo: wx.getStorageSync('userInfo'),
        hasUserInfo: true
      });
      this.loadData();
    }
  },

  loadData: function() {
    // 加载健康数据
    wx.request({
      url: getApp().globalData.baseUrl + '/health/latest',
      method: 'GET',
      success: (res) => {
        this.setData({
          healthData: res.data
        });
      }
    });

    // 加载用药提醒
    wx.request({
      url: getApp().globalData.baseUrl + '/medication/today',
      method: 'GET',
      success: (res) => {
        this.setData({
          medications: res.data
        });
      }
    });
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