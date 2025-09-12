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
    
    // 生成6位随机邀请码
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.setData({ inviteCode: code });
    
    // 生成二维码（这里模拟，实际需要调用二维码生成API）
    const qrData = JSON.stringify({
      type: 'family_bind',
      userId: userInfo._id,
      code: code
    });
    
    // TODO: 调用二维码生成API
    this.setData({ qrCodeUrl: 'path/to/qrcode' });
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
    
    wx.showLoading({ title: '绑定中...' });
    
    // TODO: 调用后端API进行绑定
    wx.request({
      url: getApp().globalData.baseUrl + '/users/bind',
      method: 'POST',
      data: {
        familyId: userInfo._id,
        inviteCode: inputCode
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '绑定申请已发送',
            icon: 'success'
          });
          this.hideInputCode();
          this.loadFamilyMembers();
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
          title: '网络错误',
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
    
    wx.request({
      url: getApp().globalData.baseUrl + `/users/${userInfo._id}/family`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({ familyMembers: res.data.data });
        }
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
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: getApp().globalData.baseUrl + '/users/unbind',
            method: 'POST',
            data: {
              userId: userInfo._id,
              familyId: familyId
            },
            success: (res) => {
              if (res.data.success) {
                wx.showToast({
                  title: '已解除绑定',
                  icon: 'success'
                });
                this.loadFamilyMembers();
              }
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