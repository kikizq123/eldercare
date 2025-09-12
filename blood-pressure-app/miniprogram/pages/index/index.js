// pages/index/index.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // 用户信息
    userInfo: {},
    
    // 时间相关
    greeting: '',
    currentDate: '',
    
    // 快速记录
    systolic: '',
    diastolic: '',
    saving: false,
    canSave: false,
    bpLevel: null,
    
    // 统计数据
    todayStats: {
      records: 0,
      avgSystolic: null,
      avgDiastolic: null
    },
    totalRecords: 0,
    
    // 最近记录
    recentRecords: [],
    lastRecord: null,
    
    // 页面状态
    loading: true
  },

  onLoad() {
    console.log('首页加载');
    this.initPage();
  },

  onShow() {
    console.log('首页显示');
    this.refreshData();
  },

  /**
   * 初始化页面
   */
  async initPage() {
    // 设置时间相关信息
    this.setTimeInfo();
    
    // 获取用户信息
    this.setUserInfo();
    
    // 加载数据
    await this.loadData();
  },

  /**
   * 设置时间信息
   */
  setTimeInfo() {
    const now = new Date();
    const hour = now.getHours();
    
    let greeting = '早上好';
    if (hour >= 12 && hour < 18) {
      greeting = '下午好';
    } else if (hour >= 18) {
      greeting = '晚上好';
    }
    
    const currentDate = util.formatTime(now, 'MM月DD日');
    
    this.setData({
      greeting,
      currentDate
    });
  },

  /**
   * 设置用户信息
   */
  setUserInfo() {
    const userInfo = app.globalData.userInfo || util.storage.get('userInfo', {});
    this.setData({
      userInfo
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    try {
      this.setData({ loading: true });
      
      // 并行加载数据
      const [recentRecordsRes, statsRes] = await Promise.all([
        this.loadRecentRecords(),
        this.loadStats()
      ]);
      
      console.log('数据加载完成');
      
    } catch (error) {
      console.error('数据加载失败:', error);
      util.toast.error('数据加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载最近记录
   */
  async loadRecentRecords() {
    try {
      const result = await api.bloodPressure.getList({
        page: 1,
        limit: 3,
        timeRange: 7
      });
      
      if (result.success && result.data && result.data.records && result.data.records.length > 0) {
        const records = result.data.records.map(record => ({
          ...record,
          timeStr: util.formatRelativeTime(record.measureTime)
        }));
        
        const lastRecord = records[0] ? {
          time: util.formatRelativeTime(records[0].measureTime)
        } : null;
        
        this.setData({
          recentRecords: records,
          lastRecord,
          totalRecords: result.data.pagination.total || 0
        });
      } else {
        // 处理无数据情况
        this.setData({
          recentRecords: [],
          lastRecord: null,
          totalRecords: 0
        });
      }
      
    } catch (error) {
      console.error('加载最近记录失败:', error);
      // 在开发环境下提供友好的错误提示
      if (error.message && error.message.includes('URLSearchParams')) {
        console.warn('检测到 URLSearchParams 兼容性问题，请刷新页面重试');
      }
      // 设置空数据以保证页面正常显示
      this.setData({
        recentRecords: [],
        lastRecord: null,
        totalRecords: 0
      });
    }
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const result = await api.bloodPressure.getStats(1); // 获取今日统计
      
      if (result.success && result.data) {
        const todayStats = {
          records: result.data.totalRecords || 0,
          avgSystolic: result.data.averages?.systolic ? 
            Math.round(result.data.averages.systolic) : null,
          avgDiastolic: result.data.averages?.diastolic ? 
            Math.round(result.data.averages.diastolic) : null
        };
        
        this.setData({ todayStats });
      } else {
        // 处理无数据情况
        this.setData({
          todayStats: {
            records: 0,
            avgSystolic: null,
            avgDiastolic: null
          }
        });
      }
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 设置空数据
      this.setData({
        todayStats: {
          records: 0,
          avgSystolic: null,
          avgDiastolic: null
        }
      });
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    if (!this.data.loading) {
      await this.loadData();
    }
  },

  /**
   * 收缩压输入
   */
  onSystolicInput(e) {
    const systolic = e.detail.value;
    this.setData({ systolic });
    this.validateInput();
  },

  /**
   * 舒张压输入
   */
  onDiastolicInput(e) {
    const diastolic = e.detail.value;
    this.setData({ diastolic });
    this.validateInput();
  },

  /**
   * 验证输入
   */
  validateInput() {
    const { systolic, diastolic } = this.data;
    
    // 基础验证
    const validation = util.validator.bloodPressure(
      Number(systolic), 
      Number(diastolic)
    );
    
    const canSave = validation.isValid && systolic && diastolic;
    
    // 获取血压分级
    let bpLevel = null;
    if (canSave) {
      bpLevel = util.getBloodPressureLevel(
        Number(systolic), 
        Number(diastolic)
      );
    }
    
    this.setData({
      canSave,
      bpLevel
    });
  },

  /**
   * 快速保存
   */
  async quickSave() {
    if (!this.data.canSave || this.data.saving) {
      return;
    }
    
    try {
      this.setData({ saving: true });
      
      const { systolic, diastolic } = this.data;
      
      const result = await api.bloodPressure.create({
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        measureTime: new Date().toISOString(),
        notes: '',
        source: 'manual'
      });
      
      if (result.success) {
        util.toast.success('记录保存成功');
        
        // 清空输入
        this.setData({
          systolic: '',
          diastolic: '',
          canSave: false,
          bpLevel: null
        });
        
        // 刷新数据
        await this.refreshData();
        
      } else {
        throw new Error(result.error || '保存失败');
      }
      
    } catch (error) {
      console.error('保存记录失败:', error);
      util.toast.error(error.message || '保存失败');
    } finally {
      this.setData({ saving: false });
    }
  },

  /**
   * 跳转到记录页面
   */
  goToRecord() {
    wx.switchTab({
      url: '/pages/record/record'
    });
  },

  /**
   * 跳转到列表页面
   */
  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    });
  },

  /**
   * 跳转到统计页面
   */
  goToStats() {
    wx.switchTab({
      url: '/pages/stats/stats'
    });
  },

  /**
   * 跳转到详情页面
   */
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    try {
      await this.refreshData();
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '血压记录 - 健康管理小助手',
      path: '/pages/index/index',
      imageUrl: '/assets/share.jpg'
    };
  }
});