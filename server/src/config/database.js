import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/neighborville';
    await mongoose.connect(mongoURI);
    logger.database('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://redis:6379',
  socket: {
    reconnectStrategy: (retries) => {
      logger.database(`Redis reconnect attempt: ${retries}`);
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
    
    await redisClient.set('test', 'Redis connection test');
    const testValue = await redisClient.get('test');
    console.log('Redis test value:', testValue);
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

export { connectMongoDB, connectRedis, redisClient };
