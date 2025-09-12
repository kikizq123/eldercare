Page({
  data: {
    healthTypes: [
      { name: '血压', type: 'bloodPressure', unit: 'mmHg', subTypes: ['收缩压', '舒张压'] },
      { name: '血糖', type: 'bloodSugar', unit: 'mmol/L' },
      { name: '体重', type: 'weight', unit: 'kg' },
      { name: '体温', type: 'temperature', unit: '°C' }
    ],
    selectedType: null,
    selectedTypeName: '',
    selectedTypeUnit: '',
    formData: {
      value: '',
      subValue: '', // 用于血压的舒张压
      notes: ''
    },
    showNotes: false
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: '/pages/profile/index'
      });
    }
  },

  // 选择健康数据类型
  selectType: function(e) {
    const type = e.currentTarget.dataset.type;
    const typeObj = this.data.healthTypes.find(t => t.type === type) || {};
    this.setData({
      selectedType: type,
      selectedTypeName: typeObj.name || '',
      selectedTypeUnit: typeObj.unit || '',
      formData: {
        value: '',
        subValue: '',
        notes: ''
      }
    });
  },

  // 输入值变化
  onValueChange: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 切换备注显示
  toggleNotes: function() {
    this.setData({
      showNotes: !this.data.showNotes
    });
  },

  // 提交数据
  submitData: function() {
    const { selectedType, formData } = this.data;
    const userInfo = wx.getStorageSync('userInfo');

    if (!selectedType) {
      wx.showToast({
        title: '请选择数据类型',
        icon: 'none'
      });
      return;
    }

    if (!formData.value) {
      wx.showToast({
        title: '请输入数值',
        icon: 'none'
      });
      return;
    }

    // 构建提交数据
    const submitData = {
      userId: userInfo._id,
      type: selectedType,
      value: parseFloat(formData.value),
      unit: this.data.healthTypes.find(t => t.type === selectedType).unit,
      notes: formData.notes
    };

    // 如果是血压，需要特殊处理
    if (selectedType === 'bloodPressure') {
      if (!formData.subValue) {
        wx.showToast({
          title: '请输入舒张压',
          icon: 'none'
        });
        return;
      }
      submitData.value = `${formData.value}/${formData.subValue}`;
    }

    // 发送请求
    wx.request({
      url: getApp().globalData.baseUrl + '/health',
      method: 'POST',
      data: submitData,
      success: (res) => {
        if (res.data.success) {
          wx.showToast({
            title: '记录成功',
            icon: 'success'
          });
          // 清空表单
          this.setData({
            selectedType: null,
            formData: {
              value: '',
              subValue: '',
              notes: ''
            }
          });
        } else {
          wx.showToast({
            title: res.data.message || '记录失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 健康数据类型点击，跳转到详情页
  viewDataDetail: function(e) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/data-detail/index?type=${type}`
    });
  }
}); 