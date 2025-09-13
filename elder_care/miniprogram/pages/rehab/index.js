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

    // 从后端获取康复计划
    wx.request({
      url: getApp().globalData.baseUrl + '/rehab',
      method: 'GET',
      data: {
        userId: userInfo._id
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const rehabItems = res.data.data || [];
          
          // 判断今日是否已打卡
          const today = new Date().toISOString().split('T')[0];
          const rehabItemsWithCheckin = rehabItems.map(item => {
            const checkins = item.checkins || [];
            const checkedToday = checkins.includes(today);
            return { ...item, checkedToday };
          });
          
          this.setData({ rehabItems: rehabItemsWithCheckin });
        } else {
          // 失败时使用本地存储作为备用
          this.loadLocalRehabItems();
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时使用本地存储
        this.loadLocalRehabItems();
      }
    });
  },

  // 加载本地存储的康复项目（备用方案）
  loadLocalRehabItems: function() {
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
    const userInfo = wx.getStorageSync('userInfo');
    
    // 找到对应的康复项目
    const index = rehabItems.findIndex(item => item._id === id);
    if (index === -1) return;
    
    const item = rehabItems[index];
    const newCheckedStatus = !item.checkedToday;
    const today = new Date().toISOString().split('T')[0];

    wx.showLoading({
      title: newCheckedStatus ? '打卡中...' : '取消中...',
      mask: true
    });

    // 调用后端打卡接口
    wx.request({
      url: getApp().globalData.baseUrl + '/rehab/checkin',
      method: 'POST',
      data: {
        planId: id,
        userId: userInfo._id,
        checked: newCheckedStatus,
        date: today
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          // 更新本地状态
          let checkins = item.checkins || [];
          
          if (newCheckedStatus) {
            // 添加打卡
            if (!checkins.includes(today)) {
              checkins.push(today);
            }
          } else {
            // 取消打卡
            checkins = checkins.filter(date => date !== today);
          }
          
          // 更新数据
          rehabItems[index] = { 
            ...item, 
            checkins, 
            checkedToday: newCheckedStatus
          };
          
          this.setData({ rehabItems });
          
          wx.showToast({
            title: res.data.message || (newCheckedStatus ? '打卡成功' : '已取消打卡'),
            icon: 'success'
          });
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
        this.updateLocalCheckinStatus(id, newCheckedStatus);
      }
    });
  },

  // 更新本地打卡状态（备用方案）
  updateLocalCheckinStatus: function(id, checked) {
    const rehabItems = this.data.rehabItems;
    const today = new Date().toLocaleDateString();
    
    const index = rehabItems.findIndex(item => item._id === id);
    if (index !== -1) {
      const item = rehabItems[index];
      let checkins = item.checkins || [];
      
      if (checked) {
        if (!checkins.includes(today)) {
          checkins.push(today);
        }
      } else {
        checkins = checkins.filter(date => date !== today);
      }
      
      rehabItems[index] = { 
        ...item, 
        checkins, 
        checkedToday: checked
      };
      
      this.setData({ rehabItems });
      wx.setStorageSync('rehabItems', rehabItems);
    }
    
    wx.showToast({
      title: checked ? '打卡成功' : '已取消打卡',
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
    const { name, frequency, notes } = this.data.addForm;
    const userInfo = wx.getStorageSync('userInfo');
    
    // 验证必填字段
    if (!name.trim() || !frequency.trim()) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'none'
      });
      return;
    }

    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '添加中...',
      mask: true
    });

    // 提交到后端
    wx.request({
      url: getApp().globalData.baseUrl + '/rehab',
      method: 'POST',
      data: {
        userId: userInfo._id,
        name: name.trim(),
        frequency: frequency.trim(),
        notes: notes.trim()
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.setData({ showAddForm: false });
          this.resetAddForm();
          this.loadRehabItems(); // 重新加载列表
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
        this.saveToLocalStorage({
          userId: userInfo._id,
          name: name.trim(),
          frequency: frequency.trim(),
          notes: notes.trim()
        });
      }
    });
  },

  // 保存到本地存储（备用方案）
  saveToLocalStorage: function(rehabData) {
    const newRehab = {
      _id: 'rehab_' + Date.now(),
      name: rehabData.name,
      frequency: rehabData.frequency,
      notes: rehabData.notes,
      checkins: [],
      createdAt: new Date().toISOString()
    };
    
    const rehabItems = wx.getStorageSync('rehabItems') || [];
    rehabItems.push(newRehab);
    wx.setStorageSync('rehabItems', rehabItems);
    
    wx.showToast({
      title: '已保存到本地',
      icon: 'success'
    });
    
    this.setData({ showAddForm: false });
    this.resetAddForm();
    this.loadLocalRehabItems();
  },

  // 重置添加表单
  resetAddForm: function() {
    this.setData({
      addForm: {
        name: '',
        frequency: '',
        notes: ''
      }
    });
  },

  // 删除康复项目
  deleteRehab: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个康复项目吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });

          // 调用后端删除接口
          wx.request({
            url: getApp().globalData.baseUrl + '/rehab/' + id,
            method: 'DELETE',
            success: (res) => {
              wx.hideLoading();
              if (res.data.success) {
                wx.showToast({
                  title: '已删除',
                  icon: 'success'
                });
                this.loadRehabItems(); // 重新加载列表
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
    let rehabItems = wx.getStorageSync('rehabItems') || [];
    rehabItems = rehabItems.filter(item => item._id !== id);
    wx.setStorageSync('rehabItems', rehabItems);
    
    wx.showToast({
      title: '已从本地删除',
      icon: 'success'
    });
    
    this.loadLocalRehabItems();
  }
});
