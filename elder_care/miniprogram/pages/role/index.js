Page({
  chooseRole(e) {
    const role = e.currentTarget.dataset.role;
    wx.setStorageSync('role', role);
    wx.showToast({ title: '选择成功', icon: 'success', duration: 800 });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 800);
  }
});
