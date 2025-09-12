// pages/record/record.js
const app = getApp();
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    // 表单数据
    formData: {
      systolic: '',
      diastolic: '',
      date: '',
      time: '',
      dateDisplay: '',
      timeDisplay: '',
      activity: 'rest',
      emotion: 'calm',
      notes: ''
    },
    
    // 验证状态
    systolicError: '',
    diastolicError: '',
    systolicFocus: false,
    
    // 血压分级
    bpLevel: null,
    
    // 选项数据
    activityOptions: [
      { label: '静息', value: 'rest' },
      { label: '轻度活动', value: 'light_activity' },
      { label: '运动后', value: 'exercise' },
      { label: '工作中', value: 'work' }
    ],
    
    emotionOptions: [
      { label: '平静', value: 'calm' },
      { label: '紧张', value: 'stressed' },
      { label: '焦虑', value: 'anxious' },
      { label: '愉快', value: 'happy' },
      { label: '疲劳', value: 'tired' }
    ],
    
    // 页面状态
    todayDate: '',
    notesLength: 0,
    canSubmit: false,
    submitting: false
  },

  onLoad(options) {
    console.log('血压记录页面加载', options);
    this.initPage();
  },

  onShow() {
    console.log('血压记录页面显示');
  },

  /**
   * 初始化页面
   */
  initPage() {
    const now = new Date();
    const today = util.formatTime(now, 'YYYY-MM-DD');
    const todayDisplay = util.formatTime(now, 'MM月DD日');
    const currentTime = util.formatTime(now, 'HH:mm');
    const timeDisplay = util.formatTime(now, 'HH:mm');
    
    this.setData({
      todayDate: today,
      'formData.date': today,
      'formData.time': currentTime,
      'formData.dateDisplay': todayDisplay,
      'formData.timeDisplay': timeDisplay
    });
  },

  /**
   * 收缩压输入
   */
  onSystolicInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.systolic': value,
      systolicError: ''
    });
    
    // 实时验证
    setTimeout(() => {
      this.validateBloodPressure();
    }, 300);
  },

  /**
   * 舒张压输入
   */
  onDiastolicInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.diastolic': value,
      diastolicError: ''
    });
    
    // 实时验证
    setTimeout(() => {
      this.validateBloodPressure();
    }, 300);
  },

  /**
   * 验证收缩压
   */
  validateSystolic() {
    const { systolic } = this.data.formData;
    let error = '';
    
    if (systolic) {
      const value = Number(systolic);
      if (isNaN(value) || value < 60 || value > 300) {
        error = '收缩压范围: 60-300';
      }
    }
    
    this.setData({ systolicError: error });
    this.validateBloodPressure();
  },

  /**
   * 验证舒张压
   */
  validateDiastolic() {
    const { diastolic } = this.data.formData;
    let error = '';
    
    if (diastolic) {
      const value = Number(diastolic);
      if (isNaN(value) || value < 30 || value > 200) {
        error = '舒张压范围: 30-200';
      }
    }
    
    this.setData({ diastolicError: error });
    this.validateBloodPressure();
  },

  /**
   * 验证血压数值并获取分级
   */
  validateBloodPressure() {
    const { systolic, diastolic } = this.data.formData;
    
    if (!systolic || !diastolic) {
      this.setData({ 
        bpLevel: null,
        canSubmit: false
      });
      return;
    }
    
    const systolicNum = Number(systolic);
    const diastolicNum = Number(diastolic);
    
    // 验证数值
    const validation = util.validator.bloodPressure(systolicNum, diastolicNum);
    
    if (!validation.isValid) {
      if (systolicNum <= diastolicNum) {
        this.setData({ 
          systolicError: '收缩压必须大于舒张压',
          bpLevel: null,
          canSubmit: false
        });
      }
      return;
    }
    
    // 获取血压分级
    const bpLevel = util.getBloodPressureLevel(systolicNum, diastolicNum);
    
    this.setData({
      bpLevel,
      canSubmit: true,
      systolicError: '',
      diastolicError: ''
    });
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    const date = e.detail.value;
    const dateObj = new Date(date);
    const dateDisplay = util.formatTime(dateObj, 'MM月DD日');
    
    this.setData({
      'formData.date': date,
      'formData.dateDisplay': dateDisplay
    });
  },

  /**
   * 时间选择
   */
  onTimeChange(e) {
    const time = e.detail.value;
    this.setData({
      'formData.time': time,
      'formData.timeDisplay': time
    });
  },

  /**
   * 活动状态选择
   */
  onActivityChange(e) {
    this.setData({
      'formData.activity': e.detail.value
    });
  },

  /**
   * 情绪状态选择
   */
  onEmotionChange(e) {
    this.setData({
      'formData.emotion': e.detail.value
    });
  },

  /**
   * 备注输入
   */
  onNotesInput(e) {
    const notes = e.detail.value;
    this.setData({
      'formData.notes': notes,
      notesLength: notes.length
    });
  },

  /**
   * 表单提交
   */
  async onSubmit() {
    if (!this.data.canSubmit || this.data.submitting) {
      return;
    }

    // 检查登录状态
    if (!app.checkLoginStatus()) {
      return;
    }

    try {
      this.setData({ submitting: true });
      
      const { formData } = this.data;
      
      // 构建测量时间（iOS兼容格式）
      // 确保使用完全兼容 iOS 的日期格式
      let measureTime;
      try {
        // 使用更安全的日期构建方法
        const dateTime = `${formData.date}T${formData.time}:00`;
        measureTime = new Date(dateTime);
        
        // 如果 ISO 格式失败，尝试分别解析日期和时间
        if (isNaN(measureTime.getTime())) {
          const [year, month, day] = formData.date.split('-').map(Number);
          const [hour, minute] = formData.time.split(':').map(Number);
          measureTime = new Date(year, month - 1, day, hour, minute, 0);
        }
        
        // 最终验证日期是否有效
        if (isNaN(measureTime.getTime())) {
          throw new Error('无效的日期格式');
        }
      } catch (error) {
        console.error('日期解析失败:', error);
        wx.showToast({
          title: '日期格式错误，请重新选择',
          icon: 'none'
        });
        return;
      }
      
      // 构建请求数据
      const requestData = {
        systolic: Number(formData.systolic),
        diastolic: Number(formData.diastolic),
        measureTime: measureTime.toISOString(),
        context: {
          beforeMeasure: {
            activity: formData.activity,
            emotion: formData.emotion
          }
        },
        notes: formData.notes.trim(),
        source: 'manual'
      };
      
      console.log('提交血压记录:', requestData);
      
      const result = await api.bloodPressure.create(requestData);
      
      if (result.success) {
        util.toast.success('记录保存成功');
        
        // 清空表单
        this.setData({
          'formData.systolic': '',
          'formData.diastolic': '',
          'formData.notes': '',
          systolicError: '',
          diastolicError: '',
          bpLevel: null,
          notesLength: 0,
          canSubmit: false
        });
        
        // 重新初始化时间
        this.initPage();
        
        // 延迟跳转，让用户看到成功提示，然后刷新首页数据
        setTimeout(() => {
          // 使用 reLaunch 重新加载首页，确保数据刷新
          // reLaunch 会重启页面，确保数据完全重新加载
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }, 1500); // 稍微延长等待时间，确保用户看到成功提示
        
      } else {
        throw new Error(result.error || '保存失败');
      }
      
    } catch (error) {
      console.error('保存记录失败:', error);
      util.toast.error(error.message || '保存失败，请重试');
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 清空表单
   */
  clearForm() {
    const confirmed = util.showConfirm({
      title: '确认清空',
      content: '确定要清空当前填写的内容吗？'
    });
    
    confirmed.then((result) => {
      if (result) {
        // 重新初始化表单
        this.initPage();
        
        this.setData({
          'formData.systolic': '',
          'formData.diastolic': '',
          'formData.activity': 'rest',
          'formData.emotion': 'calm',
          'formData.notes': '',
          systolicError: '',
          diastolicError: '',
          bpLevel: null,
          notesLength: 0,
          canSubmit: false
        });
        
        util.toast.info('已清空表单');
      }
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '血压记录 - 关爱健康从记录开始',
      path: '/pages/record/record'
    };
  }
});