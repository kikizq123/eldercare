App({
  onLaunch: function () {
    console.log('小程序启动');
    this.doLogin();
  },
  
  doLogin: function() {
    // 登录
    wx.login({
      success: res => {
        console.log('获取到登录凭证:', res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (res.code) {
          this.requestLogin(res.code);
        } else {
          console.error('登录失败！' + res.errMsg);
          this.handleLoginError('获取登录凭证失败');
        }
      },
      fail: (err) => {
        console.error('微信登录失败:', err);
        this.handleLoginError('微信登录失败');
      }
    });
  },
  
  requestLogin: function(code) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    wx.request({
      url: this.globalData.baseUrl + '/users/login',
      method: 'POST',
      data: {
        code: code
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log('登录请求成功:', res);
        
        if (res.data && res.data.success) {
          // 存储用户信息
          wx.setStorageSync('userInfo', res.data.data);
          
          // 如果是开发模式，显示提示
          if (res.data.mode === 'development') {
            console.log('当前为开发模式，使用模拟数据');
          }
          
          this.globalData.userInfo = res.data.data;
          
          // 触发登录成功事件
          if (this.loginSuccessCallback) {
            this.loginSuccessCallback(res.data.data);
          }
        } else {
          this.handleLoginError(res.data.message || '登录失败');
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('登录请求失败:', err);
        this.handleLoginError('网络连接失败，请检查网络设置');
      }
    });
  },
  
  handleLoginError: function(message) {
    console.error('登录错误:', message);
    wx.showModal({
      title: '登录失败',
      content: message + '\n\n是否重试？',
      showCancel: true,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doLogin();
        }
      }
    });
  },
  
  globalData: {
    userInfo: null,
    baseUrl: 'http://localhost:3000/api'
  }
}); 