export interface GameTime {
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeOfDay: 'morning' | 'day' | 'evening' | 'night';
  formattedTime: string;
  formattedTime24: string;
}

export interface TimeCalculation {
  startTime: number;
  endTime: number;
  duration: number;
  progress: number;
  remaining: number;
  isComplete: boolean;
}

export class TimeService {
  static toTotalMinutes(hours: number = 0, minutes: number = 0): number {
    const h = isNaN(hours) ? 0 : Math.max(0, hours);
    const m = isNaN(minutes) ? 0 : Math.max(0, minutes);
    return h * 60 + m;
  }

  static fromTotalMinutes(totalMinutes: number): { hours: number; minutes: number } {
    const total = isNaN(totalMinutes) ? 0 : Math.max(0, totalMinutes);
    return {
      hours: Math.floor(total / 60) % 24,
      minutes: Math.floor(total % 60)
    };
  }

  static createGameTime(hours: number = 0, minutes: number = 0): GameTime {
    const h = isNaN(hours) ? 0 : Math.max(0, hours) % 24;
    const m = isNaN(minutes) ? 0 : Math.max(0, minutes) % 60;
    const totalMinutes = this.toTotalMinutes(h, m);

    return {
      hours: h,
      minutes: m,
      totalMinutes,
      timeOfDay: this.getTimeOfDay(h),
      formattedTime: this.formatTime12Hour(h, m),
      formattedTime24: this.formatTime24Hour(h, m)
    };
  }

  static getCurrentTime(
    gameTime?: number,
    gameMinutes?: number,
    totalMinutes?: number
  ): GameTime {
    if (totalMinutes !== undefined && !isNaN(totalMinutes)) {
      const { hours, minutes } = this.fromTotalMinutes(totalMinutes);
      return this.createGameTime(hours, minutes);
    }

    const hours = isNaN(gameTime!) ? 8 : gameTime || 8;
    const minutes = isNaN(gameMinutes!) ? 0 : gameMinutes || 0;
    return this.createGameTime(hours, minutes);
  }

  static getTimeOfDay(hour: number): 'morning' | 'day' | 'evening' | 'night' {
    const h = isNaN(hour) ? 8 : hour % 24;
    
    if (h >= 5 && h < 10) return 'morning';
    if (h >= 10 && h < 17) return 'day';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  static formatTime12Hour(hours: number, minutes: number): string {
    const h = isNaN(hours) ? 8 : hours % 24;
    const m = isNaN(minutes) ? 0 : minutes;
    
    const displayHours = h % 12 || 12;
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayMinutes = m.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  static formatTime24Hour(hours: number, minutes: number): string {
    const h = isNaN(hours) ? 8 : hours % 24;
    const m = isNaN(minutes) ? 0 : minutes;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  static addTime(
    currentHours: number,
    currentMinutes: number,
    addMinutes: number
  ): GameTime {
    const currentTotal = this.toTotalMinutes(currentHours, currentMinutes);
    const newTotal = currentTotal + Math.max(0, addMinutes || 0);
    const { hours, minutes } = this.fromTotalMinutes(newTotal);
    
    return this.createGameTime(hours, minutes);
  }

  static calculateProductionTime(
    baseTimeMinutes: number,
    timeSpeed: number = 1
  ): number {
    const base = isNaN(baseTimeMinutes) ? 10 : Math.max(1, baseTimeMinutes);
    const speed = isNaN(timeSpeed) ? 1 : Math.max(0.1, timeSpeed);
    
    const result = Math.ceil(base / speed);
    
    if (result > 60) {
      console.log(`⚠️ TimeService.calculateProductionTime(): Long duration detected!`);
      console.log(`  Base time: ${baseTimeMinutes} minutes`);
      console.log(`  Time speed: ${timeSpeed}x`);
      console.log(`  Calculated result: ${result} minutes (${Math.floor(result/60)}h ${result%60}m)`);
    }
    
    return result;
  }

  static calculateProgress(
    startTime: number,
    endTime: number,
    currentTime: number
  ): TimeCalculation {
    const start = isNaN(startTime) ? 0 : startTime;
    const end = isNaN(endTime) ? start + 60 : Math.max(start + 1, endTime);
    const current = isNaN(currentTime) ? start : currentTime;
    
    const duration = end - start;
    const elapsed = Math.max(0, current - start);
    const remaining = Math.max(0, end - current);
    const progress = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;
    
    const isComplete = current >= end;
    const finalProgress = isComplete ? 100 : progress;
    
    if (isNaN(endTime) || endTime === undefined) {
      console.log(`⚠️ TimeService.calculateProgress(): endTime is ${endTime}, defaulting to ${end}`);
    }
    
    return {
      startTime: start,
      endTime: end,
      duration,
      progress: finalProgress,
      remaining: isComplete ? 0 : remaining,
      isComplete
    };
  }

  static formatDuration(minutes: number): string {
    const m = isNaN(minutes) ? 0 : Math.max(0, minutes);
    
    if (m > 60) {
      console.log(`⚠️ TimeService.formatDuration(): Long duration detected!`);
      console.log(`  Raw input: ${minutes}`);
      console.log(`  Processed minutes: ${m}`);
      console.log(`  Stack trace:`, new Error().stack);
    }
    
    if (m < 1) return '< 1m';
    
    const hours = Math.floor(m / 60);
    const mins = Math.ceil(m % 60);
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    
    return `${mins}m`;
  }

  static formatCompletionTime(
    currentHours: number,
    currentMinutes: number,
    addMinutes: number
  ): string {
    const completionTime = this.addTime(currentHours, currentMinutes, addMinutes);
    return completionTime.formattedTime;
  }

  static getCompletionTimeMinutes(
    currentHours: number,
    currentMinutes: number,
    addMinutes: number
  ): number {
    const currentTotal = this.toTotalMinutes(currentHours, currentMinutes);
    return currentTotal + Math.max(0, addMinutes || 0);
  }



  static validateTimeParams(gameTime?: number, gameMinutes?: number): { hours: number; minutes: number } {
    const hours = isNaN(gameTime!) ? 8 : Math.max(0, gameTime || 8) % 24;
    const minutes = isNaN(gameMinutes!) ? 0 : Math.max(0, gameMinutes || 0) % 60;
    
    return { hours, minutes };
  }

  static isNightTime(hour: number): boolean {
    const h = isNaN(hour) ? 8 : hour % 24;
    return h >= 21 || h < 5;
  }


  static getTimeMultiplier(timeSpeed: 1 | 2 | 3): number {
    return timeSpeed || 1;
  }


  static createProductionItem(
    currentHours: number,
    currentMinutes: number,
    durationMinutes: number,
    timeSpeed: number = 1,
    isQueued: boolean = false
  ): {
    startTime: number;
    endTime: number;
    duration: number;
    status: 'active' | 'queued';
  } {
    const currentTime = this.toTotalMinutes(currentHours, currentMinutes);
    const adjustedDuration = this.calculateProductionTime(durationMinutes, timeSpeed);
    
    return {
      startTime: isQueued ? 0 : currentTime,
      endTime: isQueued ? 0 : currentTime + adjustedDuration,
      duration: adjustedDuration,
      status: isQueued ? 'queued' : 'active'
    };
  }
}


export const getCurrentGameTime = TimeService.getCurrentTime;
export const formatGameTime = TimeService.formatTime12Hour;
export const formatDuration = TimeService.formatDuration;
export const calculateProductionTime = TimeService.calculateProductionTime;
export const calculateTimeProgress = TimeService.calculateProgress;
export const addTimeToGame = TimeService.addTime; 