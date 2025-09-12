const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elder_care';
console.log('Attempting to connect to MongoDB...');

mongoose.connect(mongoUri)
.then(() => {
  console.log('\u2713 Connected to MongoDB successfully');
})
.catch(err => {
  console.warn('\u26a0\ufe0f MongoDB connection failed:', err.message);
  console.log('\ud83d\udee0\ufe0f Server will continue in development mode without database');
  console.log('\ud83d\udcdd Some features may use mock data');
});

// 路由
app.use('/api/users', require('./routes/users'));
app.use('/api/health', require('./routes/health'));
app.use('/api/medication', require('./routes/medication'));
app.use('/api/rehab', require('./routes/rehab'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 