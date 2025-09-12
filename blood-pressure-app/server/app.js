const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');

const app = express();

// 安全中间件
app.use(helmet());

// 跨域配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // 生产环境域名
    : true, // 开发环境允许所有来源
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 生产环境更严格
  message: {
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', limiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// API前缀
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// 健康检查接口
app.get('/health', (req, res) => {
  const dbStatus = database.isDbConnected() ? 'connected' : 'disconnected';
  const mode = database.isDevelopment() ? 'development' : 'production';
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    mode: mode,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API路由
app.use(`${apiPrefix}/auth`, require('./routes/auth'));
app.use(`${apiPrefix}/blood-pressure`, require('./routes/bloodPressure'));
app.use(`${apiPrefix}/users`, require('./routes/users'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);

  // 开发环境返回详细错误信息
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : '服务器内部错误',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(isDev && { stack: err.stack })
  });
});

// 优雅关闭处理
const gracefulShutdown = () => {
  console.log('\n🔄 收到关闭信号，正在优雅关闭服务器...');
  
  database.disconnect().then(() => {
    console.log('👋 服务器已安全关闭');
    process.exit(0);
  }).catch((err) => {
    console.error('❌ 关闭过程中出现错误:', err);
    process.exit(1);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 启动服务器
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 连接数据库
    await database.connect();
    
    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log('🚀 血压记录服务器启动成功!');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
      console.log(`🔗 API 前缀: ${apiPrefix}`);
      console.log(`🌍 环境模式: ${process.env.NODE_ENV || 'development'}`);
      
      if (database.isDevelopment()) {
        console.log('\n⚠️  当前运行在开发模式下，部分功能使用模拟数据');
      }
    });

    // 处理服务器错误
    server.on('error', (err) => {
      console.error('❌ 服务器启动失败:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
  }
};

// 仅在直接运行时启动服务器（不在测试环境）
if (require.main === module) {
  startServer();
}

module.exports = app;