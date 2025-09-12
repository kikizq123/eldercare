// utils/api.js - API请求工具
const app = getApp();

// API基础配置
const CONFIG = {
  baseUrl: 'http://localhost:3000/api/v1',
  timeout: 10000,
  retryCount: 3
};

/**
 * 构建查询参数字符串
 * @param {Object} params - 参数对象
 * @returns {String} 查询字符串
 */
function buildQueryString(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }
  
  const pairs = [];
  for (const key in params) {
    if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  }
  
  return pairs.join('&');
}

/**
 * 统一请求方法
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      retryCount = CONFIG.retryCount
    } = options;

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : CONFIG.baseUrl + url;  

    // 设置请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };

    // 添加认证token
    const token = wx.getStorageSync('token');
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout: CONFIG.timeout,
      success(res) {
        const { statusCode, data: responseData } = res;
        
        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData);
        }
        // 401 未授权，需要重新登录
        else if (statusCode === 401) {
          handleUnauthorized();
          reject(new Error('请重新登录'));
        }
        // 其他HTTP错误
        else {
          const errorMsg = responseData?.error || `请求失败 (${statusCode})`;
          console.error('API请求错误:', errorMsg);
          reject(new Error(errorMsg));
        }
      },
      fail(err) {
        console.error('网络请求失败:', err);
        
        // 网络错误重试
        if (retryCount > 0) {
          console.log(`重试请求，剩余次数: ${retryCount - 1}`);
          setTimeout(() => {
            request({
              ...options,
              retryCount: retryCount - 1
            }).then(resolve).catch(reject);
          }, 1000);
        } else {
          reject(new Error('网络连接失败，请检查网络设置'));
        }
      }
    });
  });
}

/**
 * 处理401未授权错误
 */
function handleUnauthorized() {
  // 清除本地认证信息
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  
  // 更新全局状态
  if (app.globalData) {
    app.globalData.isLoggedIn = false;
    app.globalData.userInfo = null;
  }
  
  // 提示用户重新登录
  wx.showModal({
    title: '提示',
    content: '登录已过期，请重新登录',
    showCancel: false,
    success() {
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }
  });
}

/**
 * 用户认证相关API
 */
const auth = {
  // 微信登录
  wxLogin(data) {
    return request({
      url: '/auth/wxlogin',
      method: 'POST',
      data
    });
  },

  // 获取用户信息
  getProfile() {
    return request({
      url: '/auth/profile',
      method: 'GET'
    });
  },

  // 更新用户设置
  updateSettings(settings) {
    return request({
      url: '/auth/settings',
      method: 'PUT',
      data: { settings }
    });
  }
};

/**
 * 血压记录相关API
 */
const bloodPressure = {
  // 获取血压记录列表
  getList(params = {}) {
    const query = buildQueryString(params);
    return request({
      url: `/blood-pressure${query ? '?' + query : ''}`,
      method: 'GET'
    });
  },

  // 创建血压记录
  create(data) {
    return request({
      url: '/blood-pressure',
      method: 'POST',
      data
    });
  },

  // 获取单条记录详情
  getDetail(id) {
    return request({
      url: `/blood-pressure/${id}`,
      method: 'GET'
    });
  },

  // 更新血压记录
  update(id, data) {
    return request({
      url: `/blood-pressure/${id}`,
      method: 'PUT',
      data
    });
  },

  // 删除血压记录
  delete(id) {
    return request({
      url: `/blood-pressure/${id}`,
      method: 'DELETE'
    });
  },

  // 获取统计数据
  getStats(timeRange = 30) {
    return request({
      url: `/blood-pressure/stats/summary?timeRange=${timeRange}`,
      method: 'GET'
    });
  }
};

/**
 * 用户管理相关API
 */
const users = {
  // 获取用户列表
  getList(params = {}) {
    const query = buildQueryString(params);
    return request({
      url: `/users${query ? '?' + query : ''}`,
      method: 'GET'
    });
  },

  // 获取用户详情
  getDetail(id) {
    return request({
      url: `/users/${id}`,
      method: 'GET'
    });
  },

  // 获取系统统计
  getSystemStats() {
    return request({
      url: '/users/stats/system',
      method: 'GET'
    });
  }
};

/**
 * 便捷方法
 */
const api = {
  // 通用请求方法
  request,
  
  // 模块化API
  auth,
  bloodPressure,
  users,
  
  // GET请求
  get(url, params) {
    return request({
      url,
      method: 'GET',
      data: params
    });
  },
  
  // POST请求
  post(url, data) {
    return request({
      url,
      method: 'POST',
      data
    });
  },
  
  // PUT请求
  put(url, data) {
    return request({
      url,
      method: 'PUT',
      data
    });
  },
  
  // DELETE请求
  delete(url) {
    return request({
      url,
      method: 'DELETE'
    });
  },

  // 上传文件
  uploadFile(filePath, name = 'file', formData = {}) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      
      wx.uploadFile({
        url: CONFIG.baseUrl + '/upload',
        filePath,
        name,
        formData,
        header: token ? { 'Authorization': `Bearer ${token}` } : {},
        success(res) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (err) {
            reject(new Error('上传响应解析失败'));
          }
        },
        fail: reject
      });
    });
  }
};

module.exports = api;