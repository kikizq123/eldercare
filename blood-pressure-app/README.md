# 血压记录微信小程序

一款专注于血压数据记录和管理的微信小程序，帮助用户轻松记录、查看和分析血压变化趋势。

## 🎯 项目特色

- 📱 微信小程序原生开发，轻量便捷
- 📊 直观的血压数据可视化图表  
- 📝 简单易用的血压记录功能
- 📈 智能的血压趋势分析
- 🔒 安全的用户数据管理

## 🏗️ 技术架构

- **前端**: 微信小程序 (WXML + WXSS + JavaScript)
- **后端**: Node.js + Express
- **数据库**: MongoDB + Mongoose
- **图表**: wx-charts (微信小程序图表库)

## 📦 项目结构

```
blood-pressure-app/
├── server/                 # 后端服务
│   ├── models/            # 数据模型
│   ├── controllers/       # 控制器
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   └── app.js           # 服务器入口
├── miniprogram/          # 微信小程序
│   ├── pages/           # 页面
│   ├── utils/          # 工具函数
│   ├── components/     # 自定义组件
│   └── app.js         # 小程序入口
└── docs/               # 文档
```

## 🚀 快速开始

### 后端服务

```bash
cd server
npm install
npm run dev
```

### 微信小程序

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 配置小程序 AppID
3. 编译运行

## 📄 License

MIT License