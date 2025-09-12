Page({
  data: {
    rehabItems: [],
    showAddForm: false,
    addForm: {
      name: '',
      frequency: '',
      notes: ''
    }
  },

  onLoad: function() {
    this.loadRehabItems();
  },
  
  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadRehabItems();
  },

  // 加载康复项目列表
  loadRehabItems: function() {
    // 开发阶段使用本地数据模拟，后续对接后端API
    const rehabItems = wx.getStorageSync('rehabItems') || [];
    
    // 判断今日是否已打卡
    const today = new Date().toLocaleDateString();
    const rehabItemsWithCheckin = rehabItems.map(item => {
      const checkins = item.checkins || [];
      const checkedToday = checkins.includes(today);
      return { ...item, checkedToday };
    });
    
    this.setData({ rehabItems: rehabItemsWithCheckin });
  },

  // 切换打卡状态
  toggleCheckin: function(e) {
    const id = e.currentTarget.dataset.id;
    const rehabItems = this.data.rehabItems;
    const today = new Date().toLocaleDateString();
    
    // 找到对应的康复项目
    const index = rehabItems.findIndex(item => item._id === id);
    if (index === -1) return;
    
    // 更新打卡状态
    const item = rehabItems[index];
    let checkins = item.checkins || [];
    
    if (item.checkedToday) {
      // 取消打卡
      checkins = checkins.filter(date => date !== today);
    } else {
      // 添加打卡
      checkins.push(today);
    }
    
    // 更新数据
    rehabItems[index] = { 
      ...item, 
      checkins, 
      checkedToday: !item.checkedToday 
    };
    
    // 更新页面显示和本地存储
    this.setData({ rehabItems });
    wx.setStorageSync('rehabItems', rehabItems);
    
    // 显示提示
    wx.showToast({
      title: item.checkedToday ? '已取消打卡' : '打卡成功',
      icon: 'success'
    });
  },

  // 显示添加表单
  showAddForm: function() {
    this.setData({ 
      showAddForm: true,
      addForm: {
        name: '',
        frequency: '',
        notes: ''
      }
    });
  },

  // 隐藏添加表单
  hideAddForm: function() {
    this.setData({ showAddForm: false });
  },

  // 阻止点击表单内容时关闭表单
  stopPropagation: function() {
    return;
  },

  // 处理表单输入
  onAddInput: function(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`addForm.${field}`]: e.detail.value
    });
  },

  // 提交添加康复项目
  submitAddRehab: function() {
    const { name, frequency } = this.data.addForm;
    
    // 验证必填字段
    if (!name || !frequency) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      });
      return;
    }
    
    // 构建新项目
    const newRehab = {
      _id: 'rehab_' + Date.now(), // 本地模拟ID
      name: this.data.addForm.name,
      frequency: this.data.addForm.frequency,
      notes: this.data.addForm.notes,
      checkins: [],
      createdAt: new Date().toISOString()
    };
    
    // 添加到列表
    const rehabItems = this.data.rehabItems || [];
    rehabItems.push(newRehab);
    
    // 更新页面显示和本地存储
    this.setData({ 
      rehabItems,
      showAddForm: false
    });
    wx.setStorageSync('rehabItems', rehabItems);
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }
});
