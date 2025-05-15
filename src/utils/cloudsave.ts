import type { GameProgress } from '../types/game';

class CloudSave {
  private dbName = 'neighborville-saves';
  private dbVersion = 3;
  private storeName = 'game-saves';
  private storageKey = 'neighborville-db-version';
  private lastCloudSaveTime = 0;
  private MIN_SAVE_INTERVAL = 600 * 1000;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          console.error('IndexedDB not supported');
          throw new Error('IndexedDB not supported');
        }

        let storedVersion: number;
        try {
          const versionString = sessionStorage.getItem(this.storageKey);
          storedVersion = versionString ? parseInt(versionString, 10) : this.dbVersion;
        } catch (e) {
          storedVersion = this.dbVersion;
        }
        
        const versionToUse = Math.max(storedVersion, this.dbVersion);
        
        const request = indexedDB.open(this.dbName, versionToUse);
        
        request.onerror = (event) => {
          console.error('IndexedDB error:', event);
          
          if (request.error && request.error.name === 'VersionError') {
            try {
              console.log('Attempting to reopen with a higher version number');
              const newVersion = versionToUse + 1;
              sessionStorage.setItem(this.storageKey, newVersion.toString());
              
              this.openDB().then(resolve).catch(reject);
              return;
            } catch (e) {
              console.error('Failed to handle version error:', e);
            }
          }
          
          reject(request.error || new Error('Unknown IndexedDB error'));
        };
        
        request.onsuccess = () => {
          const db = request.result;
          
          try {
            sessionStorage.setItem(this.storageKey, db.version.toString());
          } catch (e) {
            console.warn('Could not save DB version to sessionStorage:', e);
          }
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.close();
            const newVersion = db.version + 1;
            sessionStorage.setItem(this.storageKey, newVersion.toString());
            
            const reopenRequest = indexedDB.open(this.dbName, newVersion);
            reopenRequest.onupgradeneeded = (event) => {
              const newDb = (event.target as IDBOpenDBRequest).result;
              const store = newDb.createObjectStore(this.storeName, { keyPath: 'id' });
              store.createIndex('playerName', 'playerName', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('saveType', 'saveType', { unique: false });
              console.log('Created missing object store:', this.storeName);
            };
            reopenRequest.onsuccess = () => resolve(reopenRequest.result);
            reopenRequest.onerror = () => reject(reopenRequest.error);
            return;
          }
          resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
          console.log('Database upgrade needed, creating structure...');
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('playerName', 'playerName', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('saveType', 'saveType', { unique: false });
            console.log('Created object store:', this.storeName);
          } else {
            const store = event.target && 'transaction' in event.target 
              ? (event.target as IDBOpenDBRequest).transaction?.objectStore(this.storeName)
              : null;
            if (store && !store.indexNames.contains('saveType')) {
              store.createIndex('saveType', 'saveType', { unique: false });
              console.log('Added saveType index to existing store');
            }
          }
        };
      } catch (error) {
        console.error('Error opening IndexedDB:', error);
        reject(error);
      }
    });
  }

  async saveToCloud(gameData: GameProgress, saveType: 'auto' | 'manual' = 'auto'): Promise<boolean> {
    if (!gameData.playerName) {
      console.error('Cannot save game without player name');
      return false;
    }

    await this.backupToLocalStorage(gameData);
    
    // Throttle cloud saves to prevent duplicate entries
    const now = Date.now();
    if (saveType === 'auto' && now - this.lastCloudSaveTime < this.MIN_SAVE_INTERVAL) {
      console.log('Skipping cloud save - too soon since last save');
      return true;
    }
    
    try {      
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        try {
          if (!db.objectStoreNames.contains(this.storeName)) {
            console.warn(`Object store ${this.storeName} not found in database, falling back to localStorage`);
            resolve(true); 
            return;
          }

          const transaction = db.transaction([this.storeName], 'readwrite');
          
          transaction.onerror = (event) => {
            console.error('Transaction error:', transaction.error, event);
            resolve(true);
          };
          
          transaction.oncomplete = () => {
            db.close();
            console.log(`Game ${saveType} save successfully saved to IndexedDB`);
            this.lastCloudSaveTime = now;
            resolve(true);
          };
          
          const store = transaction.objectStore(this.storeName);
          

          const playerIndex = store.index('playerName');
          const playerSavesRequest = playerIndex.getAll(gameData.playerName);
          
          playerSavesRequest.onsuccess = () => {
            const existingSaves = playerSavesRequest.result || [];
            
            // Split saves by type
            const autoSaves = existingSaves.filter(save => save.saveType === 'auto');
            const manualSaves = existingSaves.filter(save => save.saveType === 'manual' || !save.saveType);
            
            // Keep a maximum of 10 auto saves and 20 manual saves per player
            if (saveType === 'auto' && autoSaves.length >= 10) {
              // Sort by timestamp (newest first)
              const sortedSaves = autoSaves.sort((a, b) => b.timestamp - a.timestamp);
              
              // Delete all but the 9 most recent auto saves
              for (let i = 9; i < sortedSaves.length; i++) {
                store.delete(sortedSaves[i].id);
              }
            }
            
            if (saveType === 'manual' && manualSaves.length >= 20) {
              // Sort by timestamp (newest first)
              const sortedSaves = manualSaves.sort((a, b) => b.timestamp - a.timestamp);
              
              // Delete all but the 19 most recent manual saves
              for (let i = 19; i < sortedSaves.length; i++) {
                store.delete(sortedSaves[i].id);
              }
            }
            
            // Create a unique save ID that includes playerName, timestamp, and saveType
            const saveData = {
              id: `${gameData.playerName}_${now}_${saveType}`,
              playerName: gameData.playerName,
              data: gameData,
              timestamp: now,
              saveType: saveType,
              version: '1.0'
            };
            
            // For auto saves, check if an existing auto save exists from the last 5 minutes 
            // and update it instead of creating a new one
            if (saveType === 'auto') {
              const recentAutoSave = autoSaves
                .filter(save => now - save.timestamp < 5 * 60 * 1000) // Last 5 minutes
                .sort((a, b) => b.timestamp - a.timestamp)[0];
              
              if (recentAutoSave) {
                // Update the existing auto save instead of creating a new one
                saveData.id = recentAutoSave.id;
              }
            }
            
            const request = store.put(saveData);
            
            request.onerror = (event) => {
              console.error('Store put error:', request.error, event);
              resolve(true);
            };
          };
          
          playerSavesRequest.onerror = (event) => {
            console.error('Player saves query error:', playerSavesRequest.error);
            resolve(true);
          };
          
        } catch (innerError) {
          console.error('Error during IndexedDB save transaction:', innerError);
          resolve(true); 
        }
      });
    } catch (error) {
      console.error('Cloud save error:', error);
      return true; 
    }
  }

  async loadFromCloud(playerName: string): Promise<GameProgress | null> {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(this.storeName);
        const index = store.index('playerName');
        const request = index.getAll(playerName);
        
        request.onsuccess = () => {
          const saves = request.result;
          if (saves.length === 0) {
            const saved = sessionStorage.getItem('neighborville_save');
            if (saved) {
              try {
                const data = JSON.parse(saved);
                if (data.playerName === playerName) {
                  resolve(data);
                  return;
                }
              } catch (e) {
                console.error('Error parsing sessionStorage save:', e);
              }
            }
            resolve(null);
          } else {
            // Get the most recent save regardless of type
            const latestSave = saves.sort((a, b) => b.timestamp - a.timestamp)[0];
            resolve(latestSave.data);
          }
        };
        
        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Cloud load error:', error);
      try {
        const saved = sessionStorage.getItem('neighborville_save');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.playerName === playerName) {
            return data;
          }
        }
        return null;
      } catch (e) {
        console.error('SessionStorage fallback failed:', e);
        return null;
      }
    }
  }

  async getAllSaves(): Promise<Array<{id: string, playerName: string, timestamp: number, data: GameProgress, saveType?: string}>> {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        
        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Get all saves error:', error);
      return [];
    }
  }

  async deleteSave(id: string): Promise<boolean> {
    try {
      // First try to delete from server if it seems like a cloud save
      if (id.includes('_') && !id.startsWith('local_') && 
          window.navigator.onLine && process.env.NODE_ENV !== 'test') {
        try {
          // Make server delete request
          const API_URL = (window as any).API_URL || 'http://localhost:3001'; // Fallback
          const response = await fetch(`${API_URL}/api/user/game/save/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.warn(`Server deletion for ${id} failed with status ${response.status}`);
          } else {
            console.log(`Server delete successful for ID: ${id}`);
          }
        } catch (serverError) {
          console.error('Server delete error:', serverError);
          // Continue anyway to delete from local database
        }
      }
      
      // Now delete from local IndexedDB
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => {
          console.log(`Successfully deleted local save with ID: ${id}`);
          resolve(true);
        };
        
        request.onerror = () => {
          console.error('Delete request error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Delete save error:', error);
      return false;
    }
  }
  
  async deleteAllSaves(playerName: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(this.storeName);
        const index = store.index('playerName');
        const request = index.getAll(playerName);
        
        request.onsuccess = () => {
          const saves = request.result;
          let deletedCount = 0;
          let errors = 0;
          
          if (saves.length === 0) {
            resolve(true);
            return;
          }
          
          saves.forEach(save => {
            const deleteRequest = store.delete(save.id);
            deleteRequest.onsuccess = () => {
              deletedCount++;
              if (deletedCount + errors === saves.length) {
                resolve(errors === 0);
              }
            };
            
            deleteRequest.onerror = () => {
              console.error('Error deleting save:', save.id);
              errors++;
              if (deletedCount + errors === saves.length) {
                resolve(errors === 0);
              }
            };
          });
        };
        
        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Delete all saves error:', error);
      return false;
    }
  }

  async backupToLocalStorage(gameData: GameProgress): Promise<void> {
    try {
      sessionStorage.setItem('neighborville_save', JSON.stringify(gameData));
      
      if (gameData.playerName) {
        sessionStorage.setItem(
          `neighborville_autosave_${gameData.playerName.replace(/\s+/g, '_')}`, 
          JSON.stringify(gameData)
        );
      }
      
      // Keep only one backup instead of creating multiple backups
      const backupKey = `neighborville_backup`;
      sessionStorage.setItem(backupKey, JSON.stringify(gameData));
      
      // Clean up any old backup keys that might exist
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('neighborville_backup_') && key !== backupKey)
        .forEach(key => sessionStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error backing up to sessionStorage:', error);
    }
  }
  
  // New function to save multiple game saves directly to the server
  async saveToServer(saves: Array<{id: string, data: GameProgress, saveType?: string}>): Promise<boolean> {
    if (!saves || saves.length === 0) return true;
    
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('Cannot save to server: Device is offline');
        return false;
      }
      
      // Use API_URL from global or default to localhost
      const API_URL = (window as any).API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/user/game/saves/batch`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ saves })
      });
      
      if (!response.ok) {
        console.error(`Server batch save failed with status ${response.status}`);
        return false;
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving batch to server:', error);
      return false;
    }
  }
}

export const cloudSave = new CloudSave();