// pages/profile/profile.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // 用户信息
    userInfo: {},
    isLoggedIn: false,
    loginStatus: '未登录',
    
    // 用户统计
    userStats: {
      totalRecords: 0,
      avgSystolic: null,
      avgDiastolic: null
    },
    daysSinceFirst: 0,
    
    // 应用信息
    appVersion: '1.0.0'
  },

  onLoad() {
    console.log('个人页面加载');
    this.initPage();
  },

  onShow() {
    console.log('个人页面显示');
    this.refreshUserInfo();
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 获取应用版本
    const accountInfo = wx.getAccountInfoSync();
    const version = accountInfo.miniProgram.version || '1.0.0';
    
    this.setData({
      appVersion: version
    });
    
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = app.globalData.userInfo || util.storage.get('userInfo', {});
    const isLoggedIn = app.globalData.isLoggedIn || !!util.storage.get('token');
    
    let loginStatus = '未登录';
    if (isLoggedIn) {
      loginStatus = '已登录 · 正常使用';
    }
    
    this.setData({
      userInfo,
      isLoggedIn,
      loginStatus
    });
    
    // 加载用户统计
    if (isLoggedIn) {
      this.loadUserStats();
    }
  },

  /**
   * 刷新用户信息
   */
  refreshUserInfo() {
    this.loadUserInfo();
  },

  /**
   * 加载用户统计数据
   */
  async loadUserStats() {
    try {
      const result = await api.bloodPressure.getStats(365); // 获取近一年数据
      
      if (result.success && result.data) {
        const stats = result.data;
        const userStats = {
          totalRecords: stats.totalRecords || 0,
          avgSystolic: stats.averages?.systolic ? 
            Math.round(stats.averages.systolic) : null,
          avgDiastolic: stats.averages?.diastolic ? 
            Math.round(stats.averages.diastolic) : null
        };
        
        // 计算使用天数
        let daysSinceFirst = 0;
        if (this.data.userInfo.createdAt) {
          const createdDate = new Date(this.data.userInfo.createdAt);
          const now = new Date();
          daysSinceFirst = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        }
        
        this.setData({
          userStats,
          daysSinceFirst
        });
      }
      
    } catch (error) {
      console.error('加载用户统计失败:', error);
    }
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    try {
      util.toast.loading('登录中...');
      
      const user = await app.login();
      
      if (user) {
        this.loadUserInfo();
        // 不需要额外的成功提示，因为app.login()已经显示了
      }
      
    } catch (error) {
      console.error('登录失败:', error);
      // 不需要额外的错误提示，因为app.login()已经处理了
    } finally {
      util.toast.hideLoading();
    }
  },

  /**
   * 处理退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.loadUserInfo();
        }
      }
    });
  },

  /**
   * 跳转到设置页面
   */
  goToSettings() {
    wx.showToast({
      title: '功能开发中...',
      icon: 'none'
    });
  },

  /**
   * 跳转到帮助页面
   */
  goToHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '血压记录小程序帮助您轻松记录和管理血压数据。\n\n1. 点击“记录”按钮进行血压记录\n2. 在“首页”查看最新数据\n3. 在“统计”查看趋势分析\n4. 在“历史”查看记录列表',
      showCancel: false
    });
  },

  /**
   * 跳转到关于页面
   */
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '血压记录 v' + this.data.appVersion + '\n\n一款专注于血压健康管理的小程序，帮助用户轻松记录和追踪血压变化。\n\n健康管理，从记录开始。',
      showCancel: false
    });
  },

  /**
   * 清除测试数据
   */
  clearTestData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有测试数据吗？\n\n此操作将清除：\n• 用户登录信息\n• 本地缓存数据\n• 所有存储的设置',
      confirmText: '清除',
      cancelText: '取消',
      confirmColor: '#fa8c16',
      success: (res) => {
        if (res.confirm) {
          const success = app.clearAllData();
          if (success) {
            // 刷新页面数据
            this.loadUserInfo();
            
            // 延迟重新载入首页
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        }
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '血压记录 - 健康管理小助手',
      path: '/pages/index/index'
    };
  }
});
