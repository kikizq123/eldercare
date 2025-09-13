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
      notes: '',
      date: '',
      time: ''
    },
    showNotes: false,
    currentDate: '',
    currentTime: ''
  },

  onLoad: function() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: '/pages/profile/index'
      });
    }
    
    // 设置当前日期和时间
    this.setCurrentDateTime();
  },

  // 设置当前日期和时间
  setCurrentDateTime: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = `${hour}:${minute}`;
    
    this.setData({
      currentDate,
      currentTime,
      'formData.date': currentDate,
      'formData.time': currentTime
    });
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
        notes: '',
        date: this.data.currentDate,
        time: this.data.currentTime
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

  // 日期选择
  onDateChange: function(e) {
    this.setData({
      'formData.date': e.detail.value
    });
  },

  // 时间选择
  onTimeChange: function(e) {
    this.setData({
      'formData.time': e.detail.value
    });
  },

  // 数据验证
  validateData: function() {
    const { selectedType, formData } = this.data;
    
    if (!selectedType) {
      wx.showToast({
        title: '请选择数据类型',
        icon: 'none'
      });
      return false;
    }

    if (!formData.value) {
      wx.showToast({
        title: '请输入数值',
        icon: 'none'
      });
      return false;
    }

    // 血压特殊验证
    if (selectedType === 'bloodPressure') {
      if (!formData.subValue) {
        wx.showToast({
          title: '请输入舒张压',
          icon: 'none'
        });
        return false;
      }
      
      const systolic = parseFloat(formData.value);
      const diastolic = parseFloat(formData.subValue);
      
      if (systolic <= diastolic) {
        wx.showToast({
          title: '收缩压应大于舒张压',
          icon: 'none'
        });
        return false;
      }
    }

    // 数值范围验证
    const value = parseFloat(formData.value);
    const validationRules = {
      bloodPressure: { min: 50, max: 250, name: '血压' },
      bloodSugar: { min: 1, max: 30, name: '血糖' },
      weight: { min: 20, max: 200, name: '体重' },
      temperature: { min: 30, max: 45, name: '体温' }
    };

    const rule = validationRules[selectedType];
    if (rule && (value < rule.min || value > rule.max)) {
      wx.showToast({
        title: `${rule.name}数值异常，请检查`,
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 切换备注显示
  toggleNotes: function() {
    this.setData({
      showNotes: !this.data.showNotes
    });
  },

  // 提交数据
  submitData: function() {
    // 数据验证
    if (!this.validateData()) {
      return;
    }

    const { selectedType, formData } = this.data;
    const userInfo = wx.getStorageSync('userInfo');

    // 构建提交数据
    const submitData = {
      userId: userInfo._id,
      type: selectedType,
      value: parseFloat(formData.value),
      unit: this.data.healthTypes.find(t => t.type === selectedType).unit,
      notes: formData.notes,
      timestamp: new Date(`${formData.date} ${formData.time}`)
    };

    // 如果是血压，需要特殊处理
    if (selectedType === 'bloodPressure') {
      submitData.value = `${formData.value}/${formData.subValue}`;
      submitData.systolic = parseFloat(formData.value);
      submitData.diastolic = parseFloat(formData.subValue);
    }

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    // 发送请求
    wx.request({
      url: getApp().globalData.baseUrl + '/health',
      method: 'POST',
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '记录成功',
            icon: 'success'
          });
          // 重置表单
          this.resetForm();
        } else {
          wx.showToast({
            title: res.data.message || '记录失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 重置表单
  resetForm: function() {
    this.setCurrentDateTime();
    this.setData({
      selectedType: null,
      selectedTypeName: '',
      selectedTypeUnit: '',
      formData: {
        value: '',
        subValue: '',
        notes: '',
        date: this.data.currentDate,
        time: this.data.currentTime
      },
      showNotes: false
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