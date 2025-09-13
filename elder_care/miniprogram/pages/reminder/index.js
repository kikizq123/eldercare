Page({
  data: {
    medications: [],
    showAddForm: false,
    addForm: {
      name: '',
      dosage: '',
      timeList: [], // 多选时间
      customTimeInput: '', // 当前输入框内容
      customTimeList: [] // 多个自定义时间
    }
  },

  onLoad: function() {
    this.loadMedications();
  },

  onShow: function() {
    this.loadMedications();
  },

  // 加载用药计划
  loadMedications: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 从后端获取用药计划
    wx.request({
      url: getApp().globalData.baseUrl + '/medication',
      method: 'GET',
      data: {
        userId: userInfo._id
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const medications = res.data.data || [];
          const today = new Date().toISOString().split('T')[0];
          
          // 处理服用状态
          const medsWithTaken = medications.map(item => {
            const takenRecords = item.takenRecords || [];
            const todayRecord = takenRecords.find(record => record.date === today);
            const takenToday = todayRecord ? todayRecord.taken : false;
            
            return { 
              ...item, 
              takenToday,
              displayTimes: Array.isArray(item.times) ? item.times.join(' / ') : item.times
            };
          });
          
          this.setData({ medications: medsWithTaken });
        } else {
          // 失败时使用本地存储作为备用
          this.loadLocalMedications();
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时使用本地存储
        this.loadLocalMedications();
      }
    });
  },

  // 加载本地存储的用药计划（备用方案）
  loadLocalMedications: function() {
    const medications = wx.getStorageSync('medications') || [];
    const today = new Date().toLocaleDateString();
    const medsWithTaken = medications.map(item => {
      const takenDates = item.takenDates || [];
      const takenToday = takenDates.includes(today);
      return { 
        ...item, 
        takenToday,
        displayTimes: Array.isArray(item.time) ? item.time.join(' / ') : item.time
      };
    });
    this.setData({ medications: medsWithTaken });
  },

  // 显示添加表单
  showAddForm: function() {
    this.setData({
      showAddForm: true,
      addForm: { name: '', dosage: '', timeList: [], customTimeInput: '', customTimeList: [] }
    });
  },

  // 隐藏添加表单
  hideAddForm: function() {
    this.setData({ showAddForm: false });
  },

  // 阻止点击表单内容时关闭表单
  stopPropagation: function() { return; },

  // 处理表单输入
  onAddInput: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`addForm.${field}`]: e.detail.value });
  },

  // 多选时间按钮点击
  onTimeTypeBtnTap: function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const value = e.currentTarget.dataset.value;
    let timeList = this.data.addForm.timeList.slice();
    if (timeList.indexOf(value) !== -1) {
      // 已选中，取消
      timeList = timeList.filter(t => t !== value);
      console.log('取消选中:', value, '结果:', timeList);
    } else {
      timeList.push(value);
      console.log('选中:', value, '结果:', timeList);
    }
    this.setData({ 'addForm.timeList': timeList }, () => {
      console.log('当前选中的时间：', this.data.addForm.timeList);
    });
  },

  // 添加自定义时间
  addCustomTime: function(e) {
    const val = (e.detail.value || '').trim();
    if (!val) return;
    let customTimeList = this.data.addForm.customTimeList.slice();
    if (!customTimeList.includes(val)) {
      customTimeList.push(val);
    }
    this.setData({
      'addForm.customTimeList': customTimeList,
      'addForm.customTimeInput': ''
    });
  },

  // 删除自定义时间
  removeCustomTime: function(e) {
    const idx = e.currentTarget.dataset.index;
    let customTimeList = this.data.addForm.customTimeList.slice();
    customTimeList.splice(idx, 1);
    this.setData({ 'addForm.customTimeList': customTimeList });
  },

  // 提交添加用药计划
  submitAddMedication: function() {
    const { name, dosage, timeList, customTimeList } = this.data.addForm;
    let times = timeList.filter(t => t !== '自定义');
    if (timeList.includes('自定义')) {
      times = times.concat(customTimeList);
    }
    
    if (!name || !dosage || times.length === 0) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const newMed = {
      userId: userInfo._id,
      name,
      dosage,
      times: times, // 存为数组
      startDate: new Date(),
      takenRecords: []
    };

    wx.showLoading({
      title: '添加中...',
      mask: true
    });

    // 提交到后端
    wx.request({
      url: getApp().globalData.baseUrl + '/medication',
      method: 'POST',
      data: newMed,
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.setData({ showAddForm: false });
          this.resetAddForm();
          this.loadMedications(); // 重新加载列表
        } else {
          wx.showToast({ 
            title: res.data.message || '添加失败', 
            icon: 'none' 
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时保存到本地存储
        this.saveToLocalStorage(newMed);
      }
    });
  },

  // 保存到本地存储（备用方案）
  saveToLocalStorage: function(newMed) {
    const localMed = {
      _id: 'med_' + Date.now(),
      name: newMed.name,
      dosage: newMed.dosage,
      time: newMed.times,
      takenDates: []
    };
    
    const medications = wx.getStorageSync('medications') || [];
    medications.push(localMed);
    wx.setStorageSync('medications', medications);
    
    wx.showToast({ title: '已保存到本地', icon: 'success' });
    this.setData({ showAddForm: false });
    this.resetAddForm();
    this.loadLocalMedications();
  },

  // 重置添加表单
  resetAddForm: function() {
    this.setData({
      addForm: { 
        name: '', 
        dosage: '', 
        timeList: [], 
        customTimeInput: '', 
        customTimeList: [] 
      }
    });
  },

  // 删除用药计划
  deleteMedication: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个用药计划吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });

          // 调用后端删除接口
          wx.request({
            url: getApp().globalData.baseUrl + '/medication/' + id,
            method: 'DELETE',
            success: (res) => {
              wx.hideLoading();
              if (res.data.success) {
                wx.showToast({ title: '已删除', icon: 'success' });
                this.loadMedications(); // 重新加载列表
              } else {
                wx.showToast({ 
                  title: res.data.message || '删除失败', 
                  icon: 'none' 
                });
              }
            },
            fail: () => {
              wx.hideLoading();
              // 网络失败时从本地删除
              this.deleteFromLocalStorage(id);
            }
          });
        }
      }
    });
  },

  // 从本地存储删除（备用方案）
  deleteFromLocalStorage: function(id) {
    let medications = wx.getStorageSync('medications') || [];
    medications = medications.filter(item => item._id !== id);
    wx.setStorageSync('medications', medications);
    wx.showToast({ title: '已从本地删除', icon: 'success' });
    this.loadLocalMedications();
  },

  // 标记已服用
  markTaken: function(e) {
    const id = e.currentTarget.dataset.id;
    const medications = this.data.medications;
    const medication = medications.find(item => item._id === id);
    
    if (!medication) return;

    const newTakenStatus = !medication.takenToday;
    const today = new Date().toISOString().split('T')[0];

    wx.showLoading({
      title: newTakenStatus ? '标记服用中...' : '取消标记中...',
      mask: true
    });

    // 调用后端接口
    wx.request({
      url: getApp().globalData.baseUrl + '/medication/taken',
      method: 'POST',
      data: {
        medicationId: id,
        taken: newTakenStatus,
        date: today
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ 
            title: newTakenStatus ? '已标记服用' : '已取消标记', 
            icon: 'success' 
          });
          this.loadMedications(); // 重新加载列表
        } else {
          wx.showToast({ 
            title: res.data.message || '操作失败', 
            icon: 'none' 
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时更新本地存储
        this.updateLocalTakenStatus(id, newTakenStatus);
      }
    });
  },

  // 更新本地服用状态（备用方案）
  updateLocalTakenStatus: function(id, taken) {
    const today = new Date().toLocaleDateString();
    let medications = wx.getStorageSync('medications') || [];
    const index = medications.findIndex(item => item._id === id);
    
    if (index !== -1) {
      let takenDates = medications[index].takenDates || [];
      if (taken) {
        if (!takenDates.includes(today)) {
          takenDates.push(today);
        }
      } else {
        takenDates = takenDates.filter(date => date !== today);
      }
      medications[index].takenDates = takenDates;
      wx.setStorageSync('medications', medications);
    }
    
    wx.showToast({ 
      title: taken ? '已标记服用' : '已取消标记', 
      icon: 'success' 
    });
    this.loadLocalMedications();
  },

  onShareAppMessage: function() {
    const { medications } = this.data;
    const today = new Date().toLocaleDateString();
    const todayMeds = medications.filter(med => med.time && (!med.takenDates || !med.takenDates.includes(today)));
    let desc = '';
    if (todayMeds.length > 0) {
      desc = '今日待服用：' + todayMeds.map(med => `${med.name}（${med.dosage}，${Array.isArray(med.time) ? med.time.join('/') : med.time}）`).join('，');
    } else {
      desc = '今日用药已全部完成！';
    }
    return {
      title: '用药提醒',
      path: '/pages/reminder/index',
      imageUrl: '',
      desc
    };
  }
});
