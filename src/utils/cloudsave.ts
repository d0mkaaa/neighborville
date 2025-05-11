import type { GameProgress } from '../types/game';

class CloudSave {
  private dbName = 'neighborville-saves';
  private dbVersion = 2;
  private storeName = 'game-saves';
  private storageKey = 'neighborville-db-version';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          console.error('IndexedDB not supported');
          throw new Error('IndexedDB not supported');
        }

        let storedVersion: number;
        try {
          const versionString = localStorage.getItem(this.storageKey);
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
              localStorage.setItem(this.storageKey, newVersion.toString());
              
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
            localStorage.setItem(this.storageKey, db.version.toString());
          } catch (e) {
            console.warn('Could not save DB version to localStorage:', e);
          }
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.close();
            const newVersion = db.version + 1;
            localStorage.setItem(this.storageKey, newVersion.toString());
            
            const reopenRequest = indexedDB.open(this.dbName, newVersion);
            reopenRequest.onupgradeneeded = (event) => {
              const newDb = (event.target as IDBOpenDBRequest).result;
              const store = newDb.createObjectStore(this.storeName, { keyPath: 'id' });
              store.createIndex('playerName', 'playerName', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
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
            console.log('Created object store:', this.storeName);
          }
        };
      } catch (error) {
        console.error('Error opening IndexedDB:', error);
        reject(error);
      }
    });
  }

  async saveToCloud(gameData: GameProgress): Promise<boolean> {
    if (!gameData.playerName) {
      console.error('Cannot save game without player name');
      return false;
    }

    await this.backupToLocalStorage(gameData);
    
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
            console.log('Game saved successfully to IndexedDB');
            resolve(true);
          };
          
          const store = transaction.objectStore(this.storeName);
          
          const saveData = {
            id: `${gameData.playerName}_${Date.now()}`,
            playerName: gameData.playerName,
            data: gameData,
            timestamp: Date.now(),
            version: '1.0'
          };
          
          const request = store.put(saveData);
          
          request.onerror = (event) => {
            console.error('Store put error:', request.error, event);
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
            const saved = localStorage.getItem('neighborville_save');
            if (saved) {
              try {
                const data = JSON.parse(saved);
                if (data.playerName === playerName) {
                  resolve(data);
                  return;
                }
              } catch (e) {
                console.error('Error parsing localStorage save:', e);
              }
            }
            resolve(null);
          } else {
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
        const saved = localStorage.getItem('neighborville_save');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.playerName === playerName) {
            return data;
          }
        }
        return null;
      } catch (e) {
        console.error('LocalStorage fallback failed:', e);
        return null;
      }
    }
  }

  async getAllSaves(): Promise<Array<{id: string, playerName: string, timestamp: number, data: GameProgress}>> {
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
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve(true);
        
        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Delete save error:', error);
      return false;
    }
  }

  async backupToLocalStorage(gameData: GameProgress): Promise<void> {
    try {
      localStorage.setItem('neighborville_save', JSON.stringify(gameData));
      
      if (gameData.playerName) {
        localStorage.setItem(
          `neighborville_autosave_${gameData.playerName.replace(/\s+/g, '_')}`, 
          JSON.stringify(gameData)
        );
      }
      
      const backupKey = `neighborville_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(gameData));
      
      const backups = Object.keys(localStorage)
        .filter(key => key.startsWith('neighborville_backup_'))
        .sort((a, b) => {
          const timestampA = parseInt(a.split('_').pop() || '0', 10);
          const timestampB = parseInt(b.split('_').pop() || '0', 10);
          return timestampB - timestampA;
        });
        
      if (backups.length > 5) {
        for (let i = 5; i < backups.length; i++) {
          localStorage.removeItem(backups[i]);
        }
      }
      
    } catch (error) {
      console.error('Error backing up to localStorage:', error);
    }
  }
}

export const cloudSave = new CloudSave();