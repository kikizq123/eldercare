Page({
  data: {
    dataType: { name: '血压', unit: 'mmHg' }, // 默认值
    period: '周', // 默认显示周趋势
    chartData: [],
    historyData: [],
    yAxis: []
  },

  onLoad: function(options) {
    const { type } = options;
    this.setData({ currentType: type || 'bloodPressure' });
    this.setDataType(type || 'bloodPressure');
    this.loadDataByPeriod(this.data.period);
  },

  // 设置数据类型
  setDataType: function(type) {
    let dataType = { name: '血压', unit: 'mmHg' };
    
    switch(type) {
      case 'bloodPressure':
        dataType = { name: '血压', unit: 'mmHg' };
        break;
      case 'bloodSugar':
        dataType = { name: '血糖', unit: 'mmol/L' };
        break;
      case 'weight':
        dataType = { name: '体重', unit: 'kg' };
        break;
      case 'temperature':
        dataType = { name: '体温', unit: '°C' };
        break;
    }
    
    this.setData({ dataType });
  },

  // 切换周期（周/月）
  switchPeriod: function(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ period });
    this.loadDataByPeriod(period);
  },

  // 根据周期加载数据
  loadDataByPeriod: function(period) {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    const days = period === '周' ? 7 : 30;
    startDate.setDate(endDate.getDate() - days);

    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 从后端获取数据
    wx.request({
      url: getApp().globalData.baseUrl + '/health/trend',
      method: 'GET',
      data: {
        userId: userInfo._id,
        type: this.data.currentType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          const data = this.processHealthData(res.data.data);
          
          // 如果没有数据，生成模拟数据用于演示
          if (data.length === 0) {
            const mockData = this.generateMockData(period);
            this.processAndDisplayData(mockData);
          } else {
            this.processAndDisplayData(data);
          }
        } else {
          // 失败时使用模拟数据
          const mockData = this.generateMockData(period);
          this.processAndDisplayData(mockData);
        }
      },
      fail: () => {
        wx.hideLoading();
        // 网络失败时使用模拟数据
        const mockData = this.generateMockData(period);
        this.processAndDisplayData(mockData);
      }
    });
  },

  // 处理后端返回的健康数据
  processHealthData: function(rawData) {
    return rawData.map(item => {
      const date = new Date(item.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);
      
      return {
        date: dateStr,
        time: timeStr,
        value: item.value,
        rawValue: this.extractNumericValue(item.value),
        isAbnormal: this.checkIfAbnormal(item.type, item.value),
        notes: item.notes || ''
      };
    });
  },

  // 提取数值（处理血压等复合数值）
  extractNumericValue: function(value) {
    if (typeof value === 'string' && value.includes('/')) {
      // 血压格式：120/80
      return parseFloat(value.split('/')[0]);
    }
    return parseFloat(value);
  },

  // 检查数值是否异常
  checkIfAbnormal: function(type, value) {
    const numValue = this.extractNumericValue(value);
    const normalRanges = {
      bloodPressure: { min: 90, max: 140 },
      bloodSugar: { min: 3.9, max: 7.8 },
      weight: { min: 45, max: 90 },
      temperature: { min: 36, max: 37.3 }
    };
    
    const range = normalRanges[type];
    return range && (numValue < range.min || numValue > range.max);
  },

  // 处理并显示数据
  processAndDisplayData: function(data) {
    // 设置Y轴刻度
    this.setYAxis(data);
    
    // 计算并设置图表数据
    this.setChartData(data);
    
    // 设置历史数据（按日期倒序排列）
    this.setData({
      historyData: data.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
    });
  },

  // 生成模拟数据
  generateMockData: function(period) {
    const { dataType } = this.data;
    const today = new Date();
    const data = [];
    const days = period === '周' ? 7 : 30;
    
    // 定义正常范围
    const normalRange = {
      bloodPressure: { min: 90, max: 140 },
      bloodSugar: { min: 3.9, max: 7.8 },
      weight: { min: 50, max: 80 },
      temperature: { min: 36, max: 37.3 }
    };
    
    const range = normalRange[dataType.name === '血压' ? 'bloodPressure' : 
                 dataType.name === '血糖' ? 'bloodSugar' : 
                 dataType.name === '体重' ? 'weight' : 'temperature'];
    
    // 生成历史数据
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // 随机生成数值，偶尔产生异常值
      let value;
      const isAbnormal = Math.random() < 0.2; // 20%的概率产生异常值
      
      if (isAbnormal) {
        // 异常数据：高于或低于正常范围
        value = Math.random() < 0.5 ? 
                range.max + Math.random() * 20 : 
                range.min - Math.random() * 10;
      } else {
        // 正常数据：在正常范围内
        value = range.min + Math.random() * (range.max - range.min);
      }
      
      // 血压数据特殊处理，有两个值
      let displayValue = value.toFixed(1);
      if (dataType.name === '血压') {
        const diastolic = Math.round(value * 0.65); // 舒张压约为收缩压的65%
        displayValue = `${Math.round(value)}/${diastolic}`;
      }
      
      // 格式化日期
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      // 生成随机时间
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
      
      data.push({
        date: dateStr,
        time: timeStr,
        value: displayValue,
        rawValue: value,
        isAbnormal
      });
    }
    
    return data;
  },

  // 设置Y轴刻度
  setYAxis: function(data) {
    // 找出数据中的最大值和最小值
    const values = data.map(item => item.rawValue);
    const max = Math.ceil(Math.max(...values));
    const min = Math.floor(Math.min(...values));
    
    // 生成Y轴刻度（5个点）
    const yAxis = [];
    const step = (max - min) / 4;
    
    for (let i = 0; i <= 4; i++) {
      yAxis.unshift((min + i * step).toFixed(1));
    }
    
    this.setData({ yAxis });
  },

  // 计算并设置图表数据
  setChartData: function(data) {
    const { period } = this.data;
    const chartData = [];
    const yMin = Math.min(...data.map(item => item.rawValue));
    const yMax = Math.max(...data.map(item => item.rawValue));
    const yRange = yMax - yMin;
    
    // 按照周期格式化数据
    data.forEach(item => {
      const date = new Date(item.date);
      const height = yRange === 0 ? 50 : ((item.rawValue - yMin) / yRange) * 95; // 高度百分比，留出顶部空间显示数值
      
      let dateLabel = '';
      if (period === '周') {
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
        dateLabel = dayNames[date.getDay()];
      } else {
        dateLabel = date.getDate().toString();
      }
      
      chartData.push({
        date: item.date,
        dateLabel,
        value: item.value,
        height,
        isAbnormal: item.isAbnormal
      });
    });
    
    // 按日期排序（从旧到新）
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 截取最近的数据
    const limit = period === '周' ? 7 : 30;
    const recentData = chartData.slice(-limit);
    
    this.setData({ chartData: recentData });
  },

  onShareAppMessage: function() {
    const { dataType, period, chartData } = this.data;
    // 取最近一天的数据
    const latest = chartData[chartData.length - 1] || {};
    return {
      title: `${dataType.name}数据分享`,
      path: `/pages/data-detail/index?type=${dataType.name}`,
      imageUrl: '', // 可自定义生成图片
      desc: `最新${dataType.name}：${latest.value || ''}${dataType.unit}，${period}趋势一览。`
    };
  }
});
