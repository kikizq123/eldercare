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
    const medications = wx.getStorageSync('medications') || [];
    const today = new Date().toLocaleDateString();
    const medsWithTaken = medications.map(item => {
      const takenDates = item.takenDates || [];
      const takenToday = takenDates.includes(today);
      return { ...item, takenToday };
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
    const newMed = {
      _id: 'med_' + Date.now(),
      name,
      dosage,
      time: times, // 存为数组
      takenDates: []
    };
    const medications = this.data.medications || [];
    medications.push(newMed);
    this.setData({ medications, showAddForm: false });
    wx.setStorageSync('medications', medications);
    wx.showToast({ title: '添加成功', icon: 'success' });
    this.setData({
      addForm: { name: '', dosage: '', timeList: [], customTimeInput: '', customTimeList: [] }
    });
  },

  // 删除用药计划
  deleteMedication: function(e) {
    const id = e.currentTarget.dataset.id;
    let medications = this.data.medications;
    medications = medications.filter(item => item._id !== id);
    this.setData({ medications });
    wx.setStorageSync('medications', medications);
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  // 标记已服用
  markTaken: function(e) {
    const id = e.currentTarget.dataset.id;
    const today = new Date().toLocaleDateString();
    const medications = this.data.medications;
    const index = medications.findIndex(item => item._id === id);
    if (index === -1) return;
    let takenDates = medications[index].takenDates || [];
    if (medications[index].takenToday) {
      // 取消今日服用
      takenDates = takenDates.filter(date => date !== today);
    } else {
      // 添加今日服用
      takenDates.push(today);
    }
    medications[index].takenDates = takenDates;
    this.setData({ medications });
    wx.setStorageSync('medications', medications);
    wx.showToast({ title: medications[index].takenToday ? '已取消' : '已服用', icon: 'success' });
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
