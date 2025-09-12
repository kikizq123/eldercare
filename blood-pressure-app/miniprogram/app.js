// app.js
App({
  globalData: {
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    
    // API配置
    baseUrl: 'http://localhost:3000/api/v1',
    
    // 应用版本
    version: '1.0.0'
  },

  onLaunch() {
    console.log('血压记录小程序启动');
    
    // 检查微信版本
    this.checkWechatVersion();
    
    // 初始化用户信息
    this.initUserInfo();
    
    // 检查更新
    this.checkForUpdate();
  },

  onShow() {
    console.log('血压记录小程序显示');
  },

  onHide() {
    console.log('血压记录小程序隐藏');
  },

  /**
   * 检查微信版本
   */
  checkWechatVersion() {
    const version = wx.getSystemInfoSync().version;
    if (wx.canIUse('getUpdateManager')) {
      console.log('微信版本支持自动更新');
    } else {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      });
    }
  },

  /**
   * 初始化用户信息
   */
  initUserInfo() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    if (userInfo && token) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      console.log('用户已登录:', userInfo.nickname);
    } else {
      console.log('用户未登录，需要授权');
    }
  },

  /**
   * 检查小程序更新
   */
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
      });
    }
  },

  /**
   * 用户登录
   */
  async login() {
    try {
      // 获取微信登录code
      const loginRes = await this.wxLogin();
      const code = loginRes.code;
      
      if (!code) {
        throw new Error('获取微信登录code失败');
      }

      // 获取用户信息
      const userProfile = await this.getUserProfile();
      
      // 调用后端登录接口
      const api = require('./utils/api.js');
      const result = await api.request({
        url: '/auth/wxlogin',
        method: 'POST',
        data: {
          code: code,
          userInfo: userProfile.userInfo
        }
      });

      if (result.success) {
        // 保存用户信息和token
        const { user, token } = result.data;
        
        wx.setStorageSync('userInfo', user);
        wx.setStorageSync('token', token);
        
        this.globalData.userInfo = user;
        this.globalData.isLoggedIn = true;
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        return user;
      } else {
        throw new Error(result.error || '登录失败');
      }
      
    } catch (error) {
      console.error('登录失败:', error);
      
      // 如果是用户拒绝授权，给出友好提示
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      } else if (error.errMsg && error.errMsg.includes('getUserProfile:fail')) {
        // 开发环境下的模拟登录
        console.log('开发环境：使用模拟登录');
        return this.mockLogin();
      } else {
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        });
      }
      throw error;
    }
  },

  /**
   * 模拟登录（开发环境使用）
   */
  mockLogin() {
    const mockUser = {
      _id: 'mock_user_' + Date.now(),
      openId: 'mock_openid_' + Date.now(),
      nickname: '测试用户',
      avatar: '',
      settings: {
        normalRange: {
          systolic: { min: 90, max: 140 },
          diastolic: { min: 60, max: 90 }
        }
      },
      stats: {
        totalRecords: 0,
        averageSystolic: null,
        averageDiastolic: null
      },
      createdAt: new Date().toISOString()
    };
    
    const mockToken = 'mock_token_' + Date.now();
    
    // 保存模拟数据
    wx.setStorageSync('userInfo', mockUser);
    wx.setStorageSync('token', mockToken);
    
    this.globalData.userInfo = mockUser;
    this.globalData.isLoggedIn = true;
    
    wx.showToast({
      title: '模拟登录成功',
      icon: 'success'
    });
    
    return mockUser;
  },

  /**
   * 清除所有本地数据
   */
  clearAllData() {
    try {
      // 清除用户相关数据
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('token');
      
      // 清除缓存数据
      wx.removeStorageSync('recentRecords');
      wx.removeStorageSync('userStats');
      wx.removeStorageSync('lastSyncTime');
      
      // 重置全局数据
      this.globalData.userInfo = null;
      this.globalData.isLoggedIn = false;
      
      console.log('✅ 本地数据已清除');
      
      wx.showToast({
        title: '数据已清除',
        icon: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('❌ 清除数据失败:', error);
      wx.showToast({
        title: '清除失败',
        icon: 'error'
      });
      return false;
    }
  },

  /**
   * 微信登录
   */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
  },

  /**
   * 获取用户信息
   */
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      });
    });
  },

  /**
   * 用户登出
   */
  logout() {
    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    
    // 重置全局数据
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
    
    // 跳转到首页
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    if (!this.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success() {
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      });
      return false;
    }
    return true;
  },

  /**
   * 全局错误处理
   */
  onError(error) {
    console.error('小程序错误:', error);
    
    // 可以在这里上报错误到服务器
    // 或者显示友好的错误提示
  },

  /**
   * 页面不存在处理
   */
  onPageNotFound(res) {
    console.log('页面不存在:', res.path);
    
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});