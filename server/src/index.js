import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectMongoDB, connectRedis } from './config/database.js';
import emailRoutes from './routes/email.js';
import userRoutes from './routes/user.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV === 'development';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:80,http://localhost,http://localhost:3000,http://127.0.0.1:5173,http://frontend:5173').split(',');

connectMongoDB();
connectRedis();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser(process.env.COOKIE_SECRET || 'neighborvillecookiesecret'));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    if (isDevelopment) {
      return callback(null, origin);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.use('/api/email', emailRoutes);
app.use('/api/user', userRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'neighborville API Server', 
    version: '1.0.0',
    environment: isDevelopment ? 'development' : 'production'
  });
});

app.listen(PORT, () => {
  console.log(`Server running in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 