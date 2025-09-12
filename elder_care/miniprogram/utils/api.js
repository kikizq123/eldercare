/**
 * API请求工具函数
 */

const baseUrl = 'http://localhost:3000/api';

/**
 * 统一的网络请求方法
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求地址
 * @param {string} options.method - 请求方法 GET/POST/PUT/DELETE
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.showLoading - 是否显示加载提示
 * @param {string} options.loadingText - 加载提示文字
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    showLoading = true,
    loadingText = '加载中...'
  } = options;

  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      });
    }

    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (showLoading) {
          wx.hideLoading();
        }
        
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data.message || '请求失败'}`));
        }
      },
      fail: (error) => {
        if (showLoading) {
          wx.hideLoading();
        }
        reject(error);
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}, showLoading = true) {
  return request({
    url,
    method: 'GET',
    data,
    showLoading
  });
}

/**
 * POST请求
 */
function post(url, data = {}, showLoading = true) {
  return request({
    url,
    method: 'POST',
    data,
    showLoading
  });
}

/**
 * PUT请求
 */
function put(url, data = {}, showLoading = true) {
  return request({
    url,
    method: 'PUT',
    data,
    showLoading
  });
}

/**
 * DELETE请求
 */
function del(url, data = {}, showLoading = true) {
  return request({
    url,
    method: 'DELETE',
    data,
    showLoading
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};