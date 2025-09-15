Page({
  data: {
    userInfo: null
  },

  onLoad: function() {
    // 检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._id) {
      // 未登录，显示提示并重新登录
      wx.showModal({
        title: '需要登录',
        content: '请先完成微信登录',
        showCancel: false,
        success: () => {
          getApp().doLogin();
        }
      });
      return;
    }

    this.setData({ userInfo });

    // 检查是否已选择角色
    const role = wx.getStorageSync('role');
    if (role) {
      // 已选择角色，直接跳转到首页
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  chooseRole(e) {
    const role = e.currentTarget.dataset.role;
    const userInfo = this.data.userInfo;

    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 保存角色选择
    wx.setStorageSync('role', role);
    
    // 更新用户信息中的角色
    const updatedUserInfo = { ...userInfo, role };
    wx.setStorageSync('userInfo', updatedUserInfo);
    getApp().globalData.userInfo = updatedUserInfo;

    wx.showToast({ 
      title: '选择成功', 
      icon: 'success', 
      duration: 800 
    });

    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 800);
  }
});
