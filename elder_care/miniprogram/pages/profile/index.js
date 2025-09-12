Page({
  data: {
    userInfo: {
      name: '',
      phone: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    },
    medications: [],
    showAddForm: false,
    addForm: {
      name: '',
      dosage: '',
      frequency: '',
      schedule: [{ time: '' }],
      startDate: '',
      endDate: '',
      notes: ''
    }
  },

  onLoad: function () {
    this.loadUserInfo();
    this.loadMedications();
  },

  loadUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  loadMedications: function () {
    const userInfo = wx.getStorageSync('userInfo');
    wx.request({
      url: getApp().globalData.baseUrl + '/medication/today',
      method: 'GET',
      data: { userId: userInfo._id },
      success: (res) => {
        if (res.data.success) {
          this.setData({ medications: res.data.data });
        }
      }
    });
  },

  // 标记服药
  markTaken: function (e) {
    const { id, idx } = e.currentTarget.dataset;
    wx.request({
      url: getApp().globalData.baseUrl + '/medication/taken',
      method: 'POST',
      data: { medicationId: id, scheduleIndex: idx },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '已服用', icon: 'success' });
          this.loadMedications();
        }
      }
    });
  },

  // 显示添加用药表单
  showAddMedication: function () {
    this.setData({ showAddForm: true });
  },
  // 隐藏添加用药表单
  hideAddMedication: function () {
    this.setData({ showAddForm: false });
  },
  // 输入变化
  onAddInput: function (e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`addForm.${field}`]: e.detail.value });
  },
  // 添加用药计划
  submitAddMedication: function () {
    const userInfo = wx.getStorageSync('userInfo');
    const form = this.data.addForm;
    if (!form.name || !form.dosage || !form.frequency || !form.schedule[0].time) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    wx.request({
      url: getApp().globalData.baseUrl + '/medication',
      method: 'POST',
      data: {
        userId: userInfo._id,
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        schedule: [{ time: form.schedule[0].time }],
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes
      },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.setData({ showAddForm: false });
          this.loadMedications();
        }
      }
    });
  },

  // 更新用户信息
  updateUserInfo: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  // 更新紧急联系人信息
  updateEmergencyContact: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.setData({
      [`userInfo.emergencyContact.${field}`]: value
    });
  },

  // 保存用户信息
  saveUserInfo: function () {
    const userInfo = this.data.userInfo;
    wx.request({
      url: getApp().globalData.baseUrl + '/user/update',
      method: 'POST',
      data: userInfo,
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          wx.setStorageSync('userInfo', userInfo);
        }
      }
    });
  },

  // 处理用户信息输入
  handleUserInfoInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  // 处理紧急联系人信息输入
  handleEmergencyContactInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`userInfo.emergencyContact.${field}`]: value
    });
  },

  // 验证手机号格式
  validatePhone(phone) {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
  },

  // 保存信息
  saveInfo() {
    const { userInfo, emergencyContact } = this.data;

    // 验证必填字段
    if (!userInfo.name || !userInfo.phone) {
      wx.showToast({
        title: '请填写个人信息',
        icon: 'none'
      });
      return;
    }

    if (!emergencyContact.name || !emergencyContact.phone || !emergencyContact.relationship) {
      wx.showToast({
        title: '请填写紧急联系人信息',
        icon: 'none'
      });
      return;
    }

    // 验证手机号格式
    if (!this.validatePhone(userInfo.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!this.validatePhone(emergencyContact.phone)) {
      wx.showToast({
        title: '请输入正确的紧急联系人手机号',
        icon: 'none'
      });
      return;
    }

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('emergencyContact', emergencyContact);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  }
}); 