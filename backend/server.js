import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 静态文件目录路径
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// 中间件 - 调整 helmet 配置，先定义为禁用 20251015 13:30pm
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
//   crossOriginEmbedderPolicy: false
// }));

// 完全禁用所有 helmet 安全头
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
app.use(express.json({ limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 静态文件服务 - 必须放在路由之前
console.log('静态文件目录:', frontendDistPath);
app.use(express.static(frontendDistPath));

// // 静态文件服务 - 必须放在路由之前
// app.use(express.static(frontendDistPath, {
//   index: false, // 禁用目录索引
//   setHeaders: (res, filePath) => {
//     // 设置正确的 MIME 类型
//     if (filePath.endsWith('.js')) {
//       res.setHeader('Content-Type', 'application/javascript');
//     } else if (filePath.endsWith('.css')) {
//       res.setHeader('Content-Type', 'text/css');
//     }
//   }
// }));

// API路由 - 使用动态导入
const chatRoutes = await import('./routes/chat.js');
app.use('/api/chat', chatRoutes.default);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 单一路由处理：只处理 SPA 路由，不干扰静态文件
app.get('*', (req, res) => {
  // 排除 API 路由和静态文件路径
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // 如果请求的是文件路径（包含扩展名），返回 404
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return res.status(404).send('Not found');
  }
  
  // 否则返回前端应用
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`📁 Serving static files from: ${frontendDistPath}`);
});

export default app;