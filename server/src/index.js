import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectMongoDB, connectRedis } from './config/database.js';
import emailRoutes from './routes/email.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:80,http://localhost,http://localhost:3000,http://127.0.0.1:5173,http://frontend:5173').split(',');

connectMongoDB();
connectRedis();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser(process.env.COOKIE_SECRET || 'neighborvillecookiesecret'));

app.use((req, res, next) => {
  console.log('Request cookies:', req.cookies);
  const oldSend = res.send;
  res.send = function(data) {
    console.log('Response cookies:', res.getHeader('set-cookie') || 'No cookies set');
    return oldSend.apply(res, arguments);
  };
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      console.log('Request with no origin allowed');
      return callback(null, true);
    }
    
    console.log(`CORS request from origin: ${origin}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Development mode: allowing origin ${origin}`);
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`Origin ${origin} not in allowed list:`, allowedOrigins);
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    console.log(`Origin ${origin} allowed`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.use('/api/email', emailRoutes);
app.use('/api/user', userRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'NeighborVille API Server', 
    version: '1.0.0',
    endpoints: [
      { path: '/api/email/send-verification', method: 'POST', description: 'Send verification email' },
      { path: '/api/user/register', method: 'POST', description: 'Register a new user' },
      { path: '/api/user/login', method: 'POST', description: 'Login user' },
      { path: '/api/user/verify', method: 'POST', description: 'Verify email address' },
      { path: '/api/user/logout', method: 'POST', description: 'Logout user' },
      { path: '/api/user/me', method: 'GET', description: 'Get current user profile' },
      { path: '/api/user/resend-verification', method: 'POST', description: 'Resend verification email' },
      { path: '/health', method: 'GET', description: 'Health check endpoint' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 