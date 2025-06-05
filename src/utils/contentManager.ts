import type { Neighbor, Achievement, GameProgress } from "../types/game";
import { neighborProfiles } from "../data/neighbors";
import { ACHIEVEMENTS } from "../data/achievements";


export interface ContentManager {
  getNeighbors: (progress?: GameProgress) => Neighbor[];
  getAchievements: (progress?: GameProgress) => Achievement[];
  mergePlayerProgress: (baseNeighbors: Neighbor[], baseAchievements: Achievement[], progress: GameProgress) => {
    neighbors: Neighbor[];
    achievements: Achievement[];
  };
}

export function createContentManager(): ContentManager {
  
  const getNeighbors = (progress?: GameProgress): Neighbor[] => {
    if (!progress) {
      return neighborProfiles.map(neighbor => ({
        ...neighbor,
        unlocked: neighbor.unlocked || false,
        hasHome: false,
        satisfaction: 70
      }));    }

    if (progress.neighborProgress) {
      return neighborProfiles.map(baseNeighbor => {
        const playerProgress = progress.neighborProgress![baseNeighbor.id.toString()];
        return {
          ...baseNeighbor,
          unlocked: playerProgress?.unlocked ?? baseNeighbor.unlocked,
          hasHome: playerProgress?.hasHome ?? false,
          houseIndex: playerProgress?.houseIndex,
          satisfaction: playerProgress?.satisfaction ?? 70
        };
      });    }

    if (progress.neighbors && progress.neighbors.length > 0) {
      return progress.neighbors;
    }

    return neighborProfiles.map(neighbor => ({
      ...neighbor,
      unlocked: neighbor.unlocked || false,
      hasHome: false,
      satisfaction: 70
    }));
  };

  const getAchievements = (progress?: GameProgress): Achievement[] => {
    if (!progress) {
      return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        completed: false
      }));    }

    if (progress.completedAchievements) {
      return ACHIEVEMENTS.map(baseAchievement => ({
        ...baseAchievement,
        completed: progress.completedAchievements!.includes(baseAchievement.id)
      }));
    }

    if (progress.achievements && progress.achievements.length > 0) {
      return progress.achievements;    }

    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      completed: false
    }));
  };

  const mergePlayerProgress = (
    baseNeighbors: Neighbor[], 
    baseAchievements: Achievement[], 
    progress: GameProgress
  ) => {
    const neighbors = getNeighbors(progress);
    const achievements = getAchievements(progress);
    
    return { neighbors, achievements };
  };

  return {
    getNeighbors,
    getAchievements,
    mergePlayerProgress
  };
}

export const contentManager = createContentManager();

export function getNeighborsForUI(gameProgress?: GameProgress): Neighbor[] {
  return contentManager.getNeighbors(gameProgress);
}

export function getAchievementsForUI(gameProgress?: GameProgress): Achievement[] {
  return contentManager.getAchievements(gameProgress);
}

export function createGameStateWithContent(progress: GameProgress) {
  const neighbors = getNeighborsForUI(progress);
  const achievements = getAchievementsForUI(progress);
  
  return {
    ...progress,
    neighbors,
    achievements
  };
}
