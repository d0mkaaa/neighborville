import mongoose from 'mongoose';
import { redisClient } from '../config/database.js';
import { findUserById } from './userService.js';
import { validateAndSanitizeGameData, generateSaveId, isValidSaveId } from '../utils/gameDataValidator.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import { logger } from '../utils/logger.js';

const SAVE_LOCK_TIMEOUT = 30000;
const MAX_SAVES_PER_USER = 50;
const AUTO_SAVE_CLEANUP_THRESHOLD = 10;

const acquireSaveLock = async (userId, operation = 'save') => {
  if (!redisClient.isReady) {
    return { lockKey: null, release: () => {} };
  }
  
  const lockKey = `save_lock:${userId}:${operation}`;
  const lockValue = `${Date.now()}_${Math.random()}`;
  
  try {
    const acquired = await redisClient.set(lockKey, lockValue, {
      PX: SAVE_LOCK_TIMEOUT,
      NX: true
    });
    
    if (!acquired) {
      throw new Error('Save operation already in progress. Please wait and try again.');
    }
    
    return {
      lockKey,
      lockValue,
      release: async () => {
        try {
          const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          await redisClient.eval(script, {
            keys: [String(lockKey)],
            arguments: [String(lockValue)]
          });
        } catch (error) {
          logger.error('Error releasing save lock:', error);
        }
      }
    };
  } catch (error) {
    logger.error('Error acquiring save lock:', error);
    throw new Error('Unable to acquire save lock. Please try again.');
  }
};

const cleanupAutoSaves = (gameSaves) => {
  const autoSaves = gameSaves.filter(save => save.saveType === 'auto');
  const manualSaves = gameSaves.filter(save => save.saveType === 'manual');
  
  if (autoSaves.length <= AUTO_SAVE_CLEANUP_THRESHOLD) {
    return gameSaves;
  }
  
  autoSaves.sort((a, b) => b.timestamp - a.timestamp);
  const keepAutoSaves = autoSaves.slice(0, AUTO_SAVE_CLEANUP_THRESHOLD);
  
  return [...manualSaves, ...keepAutoSaves];
};

const createSaveBackup = async (userId, saves) => {
  if (!redisClient.isReady) return;
  
  try {
    const backupKey = `save_backup:${userId}:${Date.now()}`;
    await redisClient.set(backupKey, JSON.stringify(saves), { EX: 86400 * 7 });
    
    const backupKeys = await redisClient.keys(`save_backup:${userId}:*`);
    if (backupKeys.length > 5) {
      backupKeys.sort();
      const oldKeys = backupKeys.slice(0, -5);
      if (oldKeys.length > 0) {
        await redisClient.del(oldKeys);
      }
    }
  } catch (error) {
    logger.error('Error creating save backup:', error);
  }
};

export const saveGame = async (userId, gameData, saveType = 'manual', req = null) => {
  const lock = await acquireSaveLock(userId, 'save');
  
  try {
    const sanitizedGameData = validateAndSanitizeGameData(gameData, userId);
    
    const user = await findUserById(userId);
    if (!user) {
      await logSecurityEvent(userId, 'USER_NOT_FOUND', { operation: 'save' }, req);
      throw new Error('User not found');
    }
    
    if (!user.gameSaves) {
      user.gameSaves = [];
    }
    
    await createSaveBackup(userId, user.gameSaves);
    
    let saveId = sanitizedGameData.saveId;
    if (!saveId || !isValidSaveId(saveId)) {
      saveId = generateSaveId();
      sanitizedGameData.saveId = saveId;
    }
    
    const existingIndex = user.gameSaves.findIndex(save => save.id === saveId);
    
    const saveEntry = {
      id: saveId,
      playerName: sanitizedGameData.playerName,
      data: sanitizedGameData,
      timestamp: Date.now(),
      saveType: saveType,
      version: sanitizedGameData.version || '1.0',
      checksum: generateChecksum(sanitizedGameData)
    };
    
    if (existingIndex >= 0) {
      const oldSave = user.gameSaves[existingIndex];
      
      if (oldSave.timestamp > (sanitizedGameData.saveTimestamp || 0)) {
        await logSecurityEvent(userId, 'SAVE_CONFLICT', {
          saveId,
          oldTimestamp: oldSave.timestamp,
          newTimestamp: sanitizedGameData.saveTimestamp
        }, req);
        
        throw new Error('Save conflict detected. Another save was made more recently.');
      }
      
      user.gameSaves[existingIndex] = saveEntry;
    } else {
      user.gameSaves.push(saveEntry);
    }
    
    user.gameSaves = cleanupAutoSaves(user.gameSaves);
    
    if (user.gameSaves.length > MAX_SAVES_PER_USER) {
      user.gameSaves.sort((a, b) => b.timestamp - a.timestamp);
      user.gameSaves = user.gameSaves.slice(0, MAX_SAVES_PER_USER);
    }
    
    user.gameData = sanitizedGameData;
    user.lastSave = new Date();
    
    await user.save();
    
    logger.info(`Successfully saved game for user ${userId}, saveId: ${saveId}, type: ${saveType}`);
    
    return {
      success: true,
      saveId,
      timestamp: saveEntry.timestamp,
      message: 'Game saved successfully'
    };
    
  } catch (error) {
    await logSecurityEvent(userId, 'SAVE_OPERATION_FAILED', {
      error: error.message,
      saveType
    }, req);
    
    logger.error(`Save operation failed for user ${userId}:`, error);
    throw error;
  } finally {
    await lock.release();
  }
};

export const loadSave = async (userId, saveId, req = null) => {
  try {
    if (!isValidSaveId(saveId)) {
      throw new Error('Invalid save ID format');
    }
    
    const user = await findUserById(userId);
    if (!user) {
      await logSecurityEvent(userId, 'USER_NOT_FOUND', { operation: 'load', saveId }, req);
      throw new Error('User not found');
    }
    
    if (!user.gameSaves) {
      throw new Error('No saves found');
    }
    
    const save = user.gameSaves.find(s => s.id === saveId);
    if (!save) {
      await logSecurityEvent(userId, 'SAVE_NOT_FOUND', { saveId }, req);
      throw new Error('Save not found');
    }
    
    if (save.checksum) {
      const expectedChecksum = generateChecksum(save.data);
      if (save.checksum !== expectedChecksum) {
        await logSecurityEvent(userId, 'SAVE_CORRUPTION_DETECTED', {
          saveId,
          expectedChecksum,
          actualChecksum: save.checksum
        }, req);
        
        logger.warn(`Save corruption detected for saveId ${saveId}`);
      }
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    return {
      success: true,
      gameData: save.data,
      lastSave: new Date(save.timestamp),
      saveId: save.id,
      message: 'Save loaded successfully'
    };
    
  } catch (error) {
    await logSecurityEvent(userId, 'LOAD_OPERATION_FAILED', {
      error: error.message,
      saveId
    }, req);
    
    logger.error(`Load operation failed for user ${userId}:`, error);
    throw error;
  }
};

export const getAllSaves = async (userId, req = null) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      await logSecurityEvent(userId, 'USER_NOT_FOUND', { operation: 'list_saves' }, req);
      throw new Error('User not found');
    }
    
    const saves = (user.gameSaves || [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(save => ({
        id: save.id,
        playerName: save.playerName,
        timestamp: save.timestamp,
        saveType: save.saveType,
        version: save.version,
        neighborhoodName: save.data?.neighborhoodName || 'Unknown',
        level: save.data?.level || 1,
        day: save.data?.day || 1,
        coins: save.data?.coins || 0
      }));
    
    return {
      success: true,
      saves
    };
    
  } catch (error) {
    await logSecurityEvent(userId, 'LIST_SAVES_FAILED', { error: error.message }, req);
    logger.error(`List saves failed for user ${userId}:`, error);
    throw error;
  }
};

export const deleteSave = async (userId, saveId, req = null) => {
  const lock = await acquireSaveLock(userId, 'delete');
  
  try {
    if (!isValidSaveId(saveId)) {
      throw new Error('Invalid save ID format');
    }
    
    const user = await findUserById(userId);
    if (!user) {
      await logSecurityEvent(userId, 'USER_NOT_FOUND', { operation: 'delete', saveId }, req);
      throw new Error('User not found');
    }
    
    if (!user.gameSaves) {
      return { success: true, message: 'Save not found, no action needed' };
    }
    
    const saveIndex = user.gameSaves.findIndex(s => s.id === saveId);
    if (saveIndex === -1) {
      return { success: true, message: 'Save not found, no action needed' };
    }
    
    await createSaveBackup(userId, user.gameSaves);
    
    const deletedSave = user.gameSaves[saveIndex];
    user.gameSaves.splice(saveIndex, 1);
    
    await user.save();
    
    logger.info(`Successfully deleted save ${saveId} for user ${userId}`);
    
    return {
      success: true,
      message: 'Save deleted successfully'
    };
    
  } catch (error) {
    await logSecurityEvent(userId, 'DELETE_OPERATION_FAILED', {
      error: error.message,
      saveId
    }, req);
    
    logger.error(`Delete operation failed for user ${userId}:`, error);
    throw error;
  } finally {
    await lock.release();
  }
};

export const getLatestSave = async (userId, req = null) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return { success: true, gameData: null, lastSave: null };
    }
    
    if (user.gameSaves && user.gameSaves.length > 0) {
      const latestSave = user.gameSaves.reduce((latest, current) => {
        return !latest || current.timestamp > latest.timestamp ? current : latest;
      }, null);
      
      return {
        success: true,
        gameData: latestSave.data,
        lastSave: new Date(latestSave.timestamp),
        saveId: latestSave.id
      };
    }
    
    if (user.gameData) {
      return {
        success: true,
        gameData: user.gameData,
        lastSave: user.lastSave || null
      };
    }
    
    return { success: true, gameData: null, lastSave: null };
    
  } catch (error) {
    logger.error(`Get latest save failed for user ${userId}:`, error);
    throw error;
  }
};

const generateChecksum = (data) => {
  try {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  } catch (error) {
    return null;
  }
};

export default {
  saveGame,
  loadSave,
  getAllSaves,
  deleteSave,
  getLatestSave
}; 