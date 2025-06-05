import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { Achievement, Building, Neighbor } from '../types/game';

export const useGameOptimization = () => {
  const useOptimizedAchievements = (
    achievements: Achievement[],
    gameState: {
      coins: number;
      level: number;
      day: number;
      grid: (Building | null)[];
      neighbors: Neighbor[];
      [key: string]: any;
    }
  ) => {
    const debounceRef = useRef<number | null>(null);
    const [lastCheck, setLastCheck] = useState(0);
    
    const checkAchievements = useCallback(() => {
      const now = Date.now();      if (now - lastCheck < 2000) return achievements;
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = window.setTimeout(() => {
        setLastCheck(now);
      }, 500);
      
      return achievements;
    }, [achievements, gameState, lastCheck]);
    
    return useMemo(() => checkAchievements(), [checkAchievements]);
  };
  const useOptimizedGridCalculations = (grid: (Building | null)[]) => {
    return useMemo(() => {
      const buildings = grid.filter(Boolean) as Building[];
      
      const stats = {
        totalBuildings: buildings.length,
        totalIncome: buildings.reduce((sum, b) => sum + (b.income || 0), 0),
        totalEnergyUsage: buildings.reduce((sum, b) => sum + (b.energyUsage || 0), 0),
        totalPowerProduction: buildings
          .filter(b => b.isPowerGenerator)
          .reduce((sum, b) => sum + (b.powerOutput || 0), 0),
        totalWaterProduction: buildings
          .filter(b => b.isWaterSupply)
          .reduce((sum, b) => sum + (b.waterOutput || 0), 0),
        buildingsByType: buildings.reduce((acc, building) => {
          const type = building.id;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      return stats;
    }, [grid]);
  };
  const useBatchedStateUpdates = () => {
    const updateQueueRef = useRef<(() => void)[]>([]);
    const isProcessingRef = useRef(false);
    
    const batchUpdate = useCallback((updateFn: () => void) => {
      updateQueueRef.current.push(updateFn);
      
      if (!isProcessingRef.current) {        isProcessingRef.current = true;
        
        requestAnimationFrame(() => {
          const updates = updateQueueRef.current.splice(0);
          updates.forEach(update => update());
          isProcessingRef.current = false;
        });
      }
    }, []);
    
    return batchUpdate;
  };
  const useOptimizedEventHandlers = () => {
    const handlersRef = useRef<Map<string, AbortController>>(new Map());
    
    const createOptimizedHandler = useCallback((
      key: string,
      handler: (signal: AbortSignal) => void,
      dependencies: any[] = []
    ) => {      if (handlersRef.current.has(key)) {
        handlersRef.current.get(key)?.abort();
      }
      
      const controller = new AbortController();
      handlersRef.current.set(key, controller);
      
      const optimizedHandler = () => {
        if (!controller.signal.aborted) {
          handler(controller.signal);
        }
      };
      
      return optimizedHandler;
    }, []);
      useEffect(() => {
      return () => {
        handlersRef.current.forEach(controller => controller.abort());
        handlersRef.current.clear();
      };
    }, []);
    
  return createOptimizedHandler;
  };

  const useMemoryOptimization = () => {
    const memoryCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
    
    const getCachedData = useCallback((key: string, ttl: number = 5000) => {
      const cached = memoryCache.current.get(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      return null;
    }, []);
    
    const setCachedData = useCallback((key: string, data: any) => {      memoryCache.current.set(key, { data, timestamp: Date.now() });
      
      if (memoryCache.current.size > 50) {
        const entries = Array.from(memoryCache.current.entries());
        const oldEntries = entries
          .filter(([, value]) => Date.now() - value.timestamp > 10000)
          .slice(0, 10);
        
        oldEntries.forEach(([key]) => memoryCache.current.delete(key));
      }
    }, []);
    
    return { getCachedData, setCachedData };
  };

  return {
    useOptimizedAchievements,
    useOptimizedGridCalculations,
    useBatchedStateUpdates,
    useOptimizedEventHandlers,
    useMemoryOptimization
  };
};

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0
  });
  
  const measureRenderTime = useCallback((componentName: string, renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime: end - start
    }));
      if (end - start > 16) {
      console.warn(`Slow render in ${componentName}: ${(end - start).toFixed(2)}ms`);
    }
  }, []);
  
  return { metrics, measureRenderTime };
}; 