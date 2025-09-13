// 家人关系绑定页面
Page({
  data: {
    role: '',
    qrCodeUrl: '',
    inviteCode: '',
    inputCode: '',
    showQRCode: false,
    showInputCode: false,
    familyMembers: []
  },

  onLoad: function() {
    const role = wx.getStorageSync('role');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/role/index'
        });
      }, 1500);
      return;
    }
    
    this.setData({ role });
    
    if (role === 'elder') {
      this.generateInviteCode();
    }
    
    this.loadFamilyMembers();
  },

  // 生成邀请码（长辈端）
  generateInviteCode: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;
    
    wx.showLoading({
      title: '生成中...',
      mask: true
    });

    // 调用后端生成邀请码
    wx.request({
      url: getApp().globalData.baseUrl + '/users/invite-code',
      method: 'POST',
      data: {
        userId: userInfo._id
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const inviteCode = res.data.data.inviteCode;
          this.setData({ inviteCode });
          
          // 生成二维码数据
          const qrData = JSON.stringify({
            type: 'family_bind',
            userId: userInfo._id,
            code: inviteCode,
            userName: userInfo.name || '长辈用户'
          });
          
          // 这里使用微信小程序的二维码生成能力
          // 实际项目中可以调用第三方二维码生成服务
          this.setData({ 
            qrCodeUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(qrData)}`,
            qrData: qrData
          });
        } else {
          wx.showToast({
            title: res.data.message || '生成失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        // 失败时生成本地邀请码
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.setData({ inviteCode: code });
        wx.showToast({
          title: '网络异常，已生成临时邀请码',
          icon: 'none'
        });
      }
    });
  },

  // 显示二维码
  showQRCode: function() {
    this.setData({ showQRCode: true });
  },

  // 隐藏二维码
  hideQRCode: function() {
    this.setData({ showQRCode: false });
  },

  // 显示输入邀请码界面（家人端）
  showInputCode: function() {
    this.setData({ showInputCode: true });
  },

  // 隐藏输入邀请码界面
  hideInputCode: function() {
    this.setData({ showInputCode: false, inputCode: '' });
  },

  // 输入邀请码
  onCodeInput: function(e) {
    this.setData({ inputCode: e.detail.value });
  },

  // 提交绑定申请（家人端）
  submitBinding: function() {
    const { inputCode } = this.data;
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!inputCode) {
      wx.showToast({
        title: '请输入邀请码',
        icon: 'none'
      });
      return;
    }
    
    if (inputCode.length !== 6) {
      wx.showToast({
        title: '邀请码应为6位',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ 
      title: '绑定中...',
      mask: true
    });
    
    // 调用后端API进行绑定
    wx.request({
      url: getApp().globalData.baseUrl + '/users/bind',
      method: 'POST',
      data: {
        familyId: userInfo._id,
        inviteCode: inputCode.toUpperCase()
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showModal({
            title: '绑定成功',
            content: `已成功关注${res.data.data.elderUser || '长辈'}`,
            showCancel: false,
            success: () => {
              this.hideInputCode();
              this.loadFamilyMembers();
            }
          });
        } else {
          wx.showToast({
            title: res.data.message || '绑定失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络连接失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 扫描二维码（家人端）
  scanQRCode: function() {
    wx.scanCode({
      success: (res) => {
        try {
          const qrData = JSON.parse(res.result);
          if (qrData.type === 'family_bind') {
            this.setData({ inputCode: qrData.code });
            this.submitBinding();
          } else {
            wx.showToast({
              title: '无效的二维码',
              icon: 'none'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '二维码格式错误',
            icon: 'none'
          });
        }
      }
    });
  },

  // 加载家人列表
  loadFamilyMembers: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.request({
      url: getApp().globalData.baseUrl + `/users/${userInfo._id}/family`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          this.setData({ familyMembers: res.data.data || [] });
        } else {
          console.log('加载家庭成员失败:', res.data.message);
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时显示空列表
        this.setData({ familyMembers: [] });
        console.log('网络请求失败，显示空列表');
      }
    });
  },

  // 解除绑定
  unbindFamily: function(e) {
    const { familyId } = e.currentTarget.dataset;
    const userInfo = wx.getStorageSync('userInfo');
    
    wx.showModal({
      title: '确认解除绑定',
      content: '确定要解除与该家人的绑定关系吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '解除中...',
            mask: true
          });
          
          wx.request({
            url: getApp().globalData.baseUrl + '/users/unbind',
            method: 'POST',
            data: {
              userId: userInfo._id,
              familyId: familyId
            },
            success: (res) => {
              wx.hideLoading();
              if (res.data.success) {
                wx.showToast({
                  title: '已解除绑定',
                  icon: 'success'
                });
                this.loadFamilyMembers();
              } else {
                wx.showToast({
                  title: res.data.message || '解除失败',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({
                title: '网络连接失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 复制邀请码
  copyInviteCode: function() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        });
      }
    });
  }
});