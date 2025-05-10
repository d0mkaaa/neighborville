import type { GameProgress } from '../types/game';

class CloudSave {
  private dbName = 'neighborville-saves';
  private dbVersion = 1;
  private storeName = 'game-saves';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('playerName', 'playerName', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveToCloud(gameData: GameProgress): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const saveData = {
        id: `${gameData.playerName}_${Date.now()}`,
        playerName: gameData.playerName,
        data: gameData,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      const request = store.put(saveData);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Cloud save error:', error);
      return false;
    }
  }

  async loadFromCloud(playerName: string): Promise<GameProgress | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('playerName');
      
      const request = index.getAll(playerName);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const saves = request.result;
          if (saves.length === 0) {
            resolve(null);
          } else {
            const latestSave = saves.sort((a, b) => b.timestamp - a.timestamp)[0];
            resolve(latestSave.data);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Cloud load error:', error);
      return null;
    }
  }

  async getAllSaves(): Promise<Array<{id: string, playerName: string, timestamp: number, data: GameProgress}>> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Get all saves error:', error);
      return [];
    }
  }

  async deleteSave(id: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Delete save error:', error);
      return false;
    }
  }

  async backupToLocalStorage(gameData: GameProgress): Promise<void> {
    const backupKey = `neighborville_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(gameData));
    
    const backups = Object.keys(localStorage).filter(key => key.startsWith('neighborville_backup_'));
    if (backups.length > 10) {
      const sortedBackups = backups.sort();
      for (let i = 0; i < backups.length - 10; i++) {
        localStorage.removeItem(sortedBackups[i]);
      }
    }
  }
}

export const cloudSave = new CloudSave();