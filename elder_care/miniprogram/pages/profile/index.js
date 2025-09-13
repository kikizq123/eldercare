Page({
  data: {
    userInfo: {
      name: '',
      phone: '',
      role: '',
      _id: ''
    },
    emergencyContacts: [],
    familyMembers: [],
    showEditForm: false,
    showContactForm: false,
    editForm: {
      name: '',
      phone: ''
    },
    contactForm: {
      name: '',
      phone: '',
      relationship: ''
    }
  },

  onLoad: function () {
    this.loadUserInfo();
    this.loadEmergencyContacts();
    this.loadFamilyMembers();
  },

  onShow: function() {
    // 页面显示时重新加载数据
    this.loadUserInfo();
    this.loadFamilyMembers();
  },

  loadUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ 
        userInfo: {
          name: userInfo.name || '',
          phone: userInfo.phone || '',
          role: userInfo.role || '',
          _id: userInfo._id || ''
        }
      });
    } else {
      // 如果没有用户信息，跳转到登录页
      wx.showModal({
        title: '提示',
        content: '请先完成登录',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/role/index'
          });
        }
      });
    }
  },

  // 加载紧急联系人
  loadEmergencyContacts: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;

    // 从本地存储加载紧急联系人（简化版本）
    const contacts = wx.getStorageSync('emergencyContacts') || [];
    this.setData({ emergencyContacts: contacts });
  },

  // 加载家庭成员
  loadFamilyMembers: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return;

    wx.request({
      url: getApp().globalData.baseUrl + `/users/${userInfo._id}/family`,
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          this.setData({ familyMembers: res.data.data || [] });
        }
      },
      fail: () => {
        // 网络失败时显示空列表
        this.setData({ familyMembers: [] });
      }
    });
  },

  // 显示编辑个人信息表单
  showEditForm: function() {
    this.setData({
      showEditForm: true,
      editForm: {
        name: this.data.userInfo.name,
        phone: this.data.userInfo.phone
      }
    });
  },

  // 隐藏编辑表单
  hideEditForm: function() {
    this.setData({ showEditForm: false });
  },

  // 显示添加紧急联系人表单
  showContactForm: function() {
    this.setData({
      showContactForm: true,
      contactForm: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
  },

  // 隐藏联系人表单
  hideContactForm: function() {
    this.setData({ showContactForm: false });
  },

  // 处理编辑表单输入
  onEditInput: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`editForm.${field}`]: e.detail.value
    });
  },

  // 处理联系人表单输入
  onContactInput: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`contactForm.${field}`]: e.detail.value
    });
  },

  // 保存个人信息
  saveUserInfo: function() {
    const { editForm } = this.data;
    
    if (!editForm.name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!editForm.phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    if (!this.validatePhone(editForm.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const userInfo = wx.getStorageSync('userInfo');
    const updatedUserInfo = {
      ...userInfo,
      name: editForm.name,
      phone: editForm.phone
    };

    // 调用后端更新接口
    wx.request({
      url: getApp().globalData.baseUrl + `/users/${userInfo._id}`,
      method: 'PUT',
      data: {
        name: editForm.name,
        phone: editForm.phone
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          // 更新本地存储
          wx.setStorageSync('userInfo', updatedUserInfo);
          this.setData({
            userInfo: updatedUserInfo,
            showEditForm: false
          });
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时仅更新本地存储
        wx.setStorageSync('userInfo', updatedUserInfo);
        this.setData({
          userInfo: updatedUserInfo,
          showEditForm: false
        });
        wx.showToast({
          title: '已保存到本地',
          icon: 'success'
        });
      }
    });
  },

  // 添加紧急联系人
  addEmergencyContact: function() {
    const { contactForm } = this.data;
    
    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.relationship.trim()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (!this.validatePhone(contactForm.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    const newContact = {
      id: Date.now(),
      name: contactForm.name,
      phone: contactForm.phone,
      relationship: contactForm.relationship
    };

    const contacts = [...this.data.emergencyContacts, newContact];
    this.setData({
      emergencyContacts: contacts,
      showContactForm: false
    });

    // 保存到本地存储
    wx.setStorageSync('emergencyContacts', contacts);

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 删除紧急联系人
  deleteContact: function(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个紧急联系人吗？',
      success: (res) => {
        if (res.confirm) {
          const contacts = this.data.emergencyContacts.filter(contact => contact.id !== id);
          this.setData({ emergencyContacts: contacts });
          wx.setStorageSync('emergencyContacts', contacts);
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 验证手机号格式
  validatePhone: function(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
  },

  // 跳转到家庭绑定页面
  goToFamilyBind: function() {
    wx.navigateTo({
      url: '/pages/bind/index'
    });
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.clearStorageSync();
          wx.showToast({
            title: '已退出',
            icon: 'success'
          });
          // 跳转到角色选择页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/role/index'
            });
          }, 1500);
        }
      }
    });
  }
}); 