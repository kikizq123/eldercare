// utils/util.js - 通用工具函数

/**
 * 格式化时间
 * @param {Date|string|number} date - 日期对象、时间字符串或时间戳
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  const second = d.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 相对时间格式化
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 */
function formatRelativeTime(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now - targetDate;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatTime(targetDate, 'MM-DD');
  }
}

/**
 * 血压分级判断
 * @param {number} systolic - 收缩压
 * @param {number} diastolic - 舒张压
 * @returns {object} 血压分级信息
 */
function getBloodPressureLevel(systolic, diastolic) {
  if (systolic < 120 && diastolic < 80) {
    return {
      level: 'optimal',
      name: '理想血压',
      color: '#52c41a',
      description: '血压正常，继续保持健康生活方式'
    };
  }
  
  if (systolic < 130 && diastolic < 85) {
    return {
      level: 'normal',
      name: '正常血压',
      color: '#1890ff',
      description: '血压正常范围内'
    };
  }
  
  if (systolic < 140 && diastolic < 90) {
    return {
      level: 'high_normal',
      name: '正常高值',
      color: '#faad14',
      description: '建议调整生活方式，定期监测'
    };
  }
  
  if (systolic < 160 && diastolic < 100) {
    return {
      level: 'mild_hypertension',
      name: '1级高血压',
      color: '#fa8c16',
      description: '建议就医咨询，调整生活方式'
    };
  }
  
  if (systolic < 180 && diastolic < 110) {
    return {
      level: 'moderate_hypertension',
      name: '2级高血压',
      color: '#f5222d',
      description: '请及时就医，需要药物治疗'
    };
  }
  
  return {
    level: 'severe_hypertension',
    name: '3级高血压',
    color: '#a8071a',
    description: '请立即就医！需要紧急处理'
  };
}

/**
 * 数据验证工具
 */
const validator = {
  // 血压值验证
  bloodPressure(systolic, diastolic) {
    const errors = [];
    
    // 基础验证
    if (!systolic || systolic < 60 || systolic > 300) {
      errors.push('收缩压应在60-300mmHg之间');
    }
    
    if (!diastolic || diastolic < 30 || diastolic > 200) {
      errors.push('舒张压应在30-200mmHg之间');
    }
    
    // 关系验证
    if (systolic && diastolic && systolic <= diastolic) {
      errors.push('收缩压必须大于舒张压');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // 手机号验证
  phone(phone) {
    const phoneReg = /^1[3-9]\d{9}$/;
    return phoneReg.test(phone);
  },
  
  // 邮箱验证
  email(email) {
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailReg.test(email);
  }
};

/**
 * 本地存储工具
 */
const storage = {
  // 设置数据
  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      return false;
    }
  },
  
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key);
      return value !== '' ? value : defaultValue;
    } catch (error) {
      console.error('获取数据失败:', error);
      return defaultValue;
    }
  },
  
  // 删除数据
  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  },
  
  // 清空存储
  clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (error) {
      console.error('清空存储失败:', error);
      return false;
    }
  }
};

/**
 * 提示工具
 */
const toast = {
  // 成功提示
  success(title, duration = 2000) {
    wx.showToast({
      title,
      icon: 'success',
      duration
    });
  },
  
  // 失败提示
  error(title, duration = 3000) {
    wx.showToast({
      title,
      icon: 'error',
      duration
    });
  },
  
  // 普通提示
  info(title, duration = 2000) {
    wx.showToast({
      title,
      icon: 'none',
      duration
    });
  },
  
  // 加载提示
  loading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },
  
  // 隐藏加载
  hideLoading() {
    wx.hideLoading();
  }
};

/**
 * 确认对话框
 */
function showConfirm(options) {
  const {
    title = '提示',
    content,
    confirmText = '确定',
    cancelText = '取消',
    confirmColor = '#4A90E2'
  } = options;
  
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      confirmColor,
      success(res) {
        resolve(res.confirm);
      },
      fail() {
        resolve(false);
      }
    });
  });
}

/**
 * 数字格式化
 */
const number = {
  // 保留小数点
  toFixed(num, digits = 1) {
    return Number(num).toFixed(digits);
  },
  
  // 千分位分隔
  toThousands(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  // 数字范围限制
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
};

/**
 * 数组工具
 */
const array = {
  // 去重
  unique(arr) {
    return [...new Set(arr)];
  },
  
  // 按字段分组
  groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const value = item[key];
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {});
  },
  
  // 排序
  sortBy(arr, key, order = 'asc') {
    return arr.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }
};

/**
 * 节流函数
 */
function throttle(func, delay) {
  let timer = null;
  
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(this, args);
        timer = null;
      }, delay);
    }
  };
}

/**
 * 防抖函数
 */
function debounce(func, delay) {
  let timer = null;
  
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  try {
    return wx.getSystemInfoSync();
  } catch (error) {
    console.error('获取系统信息失败:', error);
    return {};
  }
}

module.exports = {
  formatTime,
  formatRelativeTime,
  getBloodPressureLevel,
  validator,
  storage,
  toast,
  showConfirm,
  number,
  array,
  throttle,
  debounce,
  deepClone,
  getSystemInfo
};