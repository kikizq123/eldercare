/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date|string|number} date - 时间
 * @param {string} fmt - 格式字符串，如 'yyyy-MM-dd hh:mm:ss'
 */
function formatTime(date, fmt = 'yyyy-MM-dd hh:mm:ss') {
  if (!date) return '';
  
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }

  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  
  return fmt;
}

/**
 * 获取友好的时间显示
 * @param {Date|string|number} date - 时间
 */
function getTimeAgo(date) {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前';
  } else {
    return formatTime(date, 'MM-dd');
  }
}

/**
 * 验证手机号
 * @param {string} phone - 手机号
 */
function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/;
  return reg.test(phone);
}

/**
 * 验证血压值
 * @param {string} systolic - 收缩压
 * @param {string} diastolic - 舒张压
 */
function validateBloodPressure(systolic, diastolic) {
  const sys = parseFloat(systolic);
  const dia = parseFloat(diastolic);
  
  if (isNaN(sys) || isNaN(dia)) {
    return { valid: false, message: '请输入有效的数字' };
  }
  
  if (sys < 60 || sys > 300) {
    return { valid: false, message: '收缩压应在60-300之间' };
  }
  
  if (dia < 40 || dia > 200) {
    return { valid: false, message: '舒张压应在40-200之间' };
  }
  
  if (sys <= dia) {
    return { valid: false, message: '收缩压应大于舒张压' };
  }
  
  return { valid: true };
}

/**
 * 验证血糖值
 * @param {string} value - 血糖值
 */
function validateBloodSugar(value) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, message: '请输入有效的数字' };
  }
  
  if (num < 1 || num > 50) {
    return { valid: false, message: '血糖值应在1-50之间' };
  }
  
  return { valid: true };
}

/**
 * 获取健康数据的正常范围描述
 * @param {string} type - 数据类型
 */
function getNormalRange(type) {
  const ranges = {
    bloodPressure: '正常范围：收缩压90-140mmHg，舒张压60-90mmHg',
    bloodSugar: '正常范围：空腹3.9-6.1mmol/L，餐后<7.8mmol/L',
    weight: '建议定期监测体重变化',
    temperature: '正常范围：36.0-37.5°C'
  };
  
  return ranges[type] || '';
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 深拷贝
 * @param {any} obj - 要拷贝的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

module.exports = {
  formatTime,
  getTimeAgo,
  validatePhone,
  validateBloodPressure,
  validateBloodSugar,
  getNormalRange,
  debounce,
  deepClone
};