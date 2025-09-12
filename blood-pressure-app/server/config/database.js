const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
    this.isDevelopmentMode = false;
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood_pressure';
    
    console.log('🔄 尝试连接到 MongoDB...');
    console.log(`📍 连接地址: ${mongoUri}`);

    try {
      // MongoDB连接选项
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      };

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB 连接成功!');
      
      // 监听连接事件
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB 连接错误:', err);
        this.handleConnectionError();
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB 连接断开');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB 重新连接成功');
        this.isConnected = true;
        this.isDevelopmentMode = false;
      });

    } catch (error) {
      console.error('❌ MongoDB 连接失败:', error.message);
      this.handleConnectionError();
    }
  }

  handleConnectionError() {
    this.isConnected = false;
    this.isDevelopmentMode = true;
    
    console.log('🛠️  启动开发模式 - 使用模拟数据');
    console.log('💡 提示: 确保 MongoDB 服务已启动');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
    console.log('   - Windows: net start MongoDB');
  }

  isDbConnected() {
    return this.isConnected;
  }

  isDevelopment() {
    return this.isDevelopmentMode;
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB 连接已关闭');
    }
  }
}

module.exports = new Database();