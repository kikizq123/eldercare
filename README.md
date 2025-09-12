# 长辈关怀宝 - 老年健康与康复管理小程序

## 项目概述

长辈关怀宝是一款专为老年人及其家人设计的微信小程序，提供便捷的健康数据监测、康复过程追踪、用药提醒及生活管理功能。通过与微信生态的结合，促进家人间的关怀与信息共享，提升老年人居家康养的生活品质与安全性。

## 项目结构

```
elder_care/
├── miniprogram/          # 微信小程序前端
│   ├── pages/           # 页面目录
│   │   ├── index/       # 首页
│   │   ├── role/        # 角色选择
│   │   ├── bind/        # 家人绑定
│   │   ├── data/        # 健康数据录入
│   │   ├── data-detail/ # 数据详情
│   │   ├── reminder/    # 用药提醒
│   │   ├── rehab/       # 康复训练
│   │   └── profile/     # 个人中心
│   ├── utils/           # 工具函数
│   │   ├── api.js       # API请求工具
│   │   └── util.js      # 通用工具函数
│   ├── app.js           # 小程序主文件
│   ├── app.json         # 小程序配置
│   └── sitemap.json     # 搜索配置
├── server/              # Node.js后端
│   ├── controllers/     # 控制器
│   │   ├── userController.js      # 用户管理
│   │   ├── healthController.js    # 健康数据
│   │   ├── medicationController.js # 用药管理
│   │   └── rehabController.js     # 康复管理
│   ├── models/          # 数据模型
│   │   ├── User.js      # 用户模型
│   │   ├── HealthData.js # 健康数据模型
│   │   ├── Medication.js # 用药模型
│   │   └── Rehab.js     # 康复模型
│   ├── routes/          # 路由配置
│   │   ├── users.js     # 用户路由
│   │   ├── health.js    # 健康数据路由
│   │   ├── medication.js # 用药路由
│   │   └── rehab.js     # 康复路由
│   ├── app.js           # 服务器主文件
│   ├── package.json     # 依赖配置
│   └── .env             # 环境变量配置
└── PRD                  # 产品需求文档
```

## 核心功能

### 1. 用户体系与关系绑定
- 微信授权登录
- 角色选择（长辈端/家人端）
- 家人关系绑定（二维码/邀请码）
- 个人信息管理

### 2. 健康数据监测
- 手动录入（血压、血糖、体重、体温）
- 数据可视化展示
- 异常数据标记
- 健康报告生成

### 3. 康复管理
- 康复计划创建
- 康复任务打卡
- 进度统计分析
- 家人查看功能

### 4. 用药提醒
- 药品信息管理
- 定时提醒推送
- 服用记录追踪
- 依从性统计

### 5. 安全功能
- SOS一键求助
- 异常数据警报
- 紧急联系人通知

## 技术栈

### 前端（小程序）
- 微信小程序原生开发
- WXML + WXSS + JavaScript
- 微信API（登录、地理位置等）

### 后端
- Node.js + Express
- MongoDB + Mongoose
- 微信小程序API集成

## 安装与运行

### 前置要求
- Node.js (v16+)
- MongoDB
- 微信开发者工具

### 后端安装

1. 进入后端目录：
```bash
cd elder_care/server
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量（.env文件已创建，需要修改相应配置）：
```env
MONGODB_URI=mongodb://localhost:27017/elder_care
WX_APPID=your_wechat_appid_here
WX_SECRET=your_wechat_secret_here
```

4. 启动开发服务器：
```bash
npm run dev
```

5. 启动生产服务器：
```bash
npm start
```

### 前端运行

1. 使用微信开发者工具打开 `elder_care/miniprogram` 目录
2. 配置AppID（如果有的话）
3. 确保后端服务器在运行
4. 点击编译运行

## API文档

### 用户相关 `/api/users`
- `POST /login` - 用户登录
- `GET /test` - API测试
- `PUT /:userId` - 更新用户信息
- `POST /:userId/contacts` - 添加紧急联系人
- `POST /sos` - SOS求助

### 健康数据 `/api/health`
- `POST /` - 添加健康数据
- `GET /latest` - 获取最新数据
- `GET /user/:userId` - 获取用户健康数据

### 用药管理 `/api/medication`
- `POST /` - 添加用药记录
- `GET /today` - 获取今日用药
- `GET /user/:userId` - 获取用户用药信息

### 康复管理 `/api/rehab`
- `POST /plans` - 创建康复计划
- `GET /plans/user/:userId` - 获取用户康复计划
- `POST /records` - 记录康复训练
- `GET /tasks/user/:userId/today` - 获取今日康复任务
- `GET /stats/user/:userId` - 获取康复统计

## 开发状态

✅ **已完成：**
- 项目基础架构搭建
- 后端API框架
- 数据库模型设计
- 核心页面结构
- 康复管理功能
- 环境配置

🚧 **待完善：**
- 微信小程序真实API集成
- 数据可视化图表
- 推送通知功能
- 图片上传功能
- 更多页面样式优化

## 部署建议

### 开发环境
- 后端：`npm run dev`（支持热重载）
- 前端：微信开发者工具

### 生产环境
- 数据库：MongoDB Atlas 或自建MongoDB
- 后端：PM2 + Nginx 反向代理
- 域名：需要备案的HTTPS域名
- 微信：正式的小程序AppID和Secret

## 注意事项

1. **微信配置**：需要在微信公众平台配置小程序相关信息
2. **数据库**：确保MongoDB服务正常运行
3. **网络**：小程序要求HTTPS，开发时可使用localhost
4. **权限**：某些功能需要用户授权（地理位置、通知等）

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目仅供学习和开发参考使用。

## 联系方式

如有问题，请通过GitHub Issues联系。