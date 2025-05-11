import { useEffect } from 'react';
import type { TimeOfDay, WeatherType } from '../types/game';

type TimeSystemParams = {
  gameTime: number;
  gameMinutes: number;
  timePaused: boolean;
  setGameTime: (time: number) => void;
  setGameMinutes: (minutes: number) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setWeather: (weather: WeatherType) => void;
  setWeatherForecast: (forecast: WeatherType[]) => void;
  weatherForecast: WeatherType[];
  onHourlyEffects: (newTime: number) => void;
  onEndDay: () => void;
};

export const useTimeSystem = ({
  gameTime,
  gameMinutes,
  timePaused,
  setGameTime,
  setGameMinutes,
  setTimeOfDay,
  setWeather,
  setWeatherForecast,
  weatherForecast,
  onHourlyEffects,
  onEndDay
}: TimeSystemParams) => {
  useEffect(() => {
    if (!timePaused) {
      const timer = setInterval(() => {
        setGameMinutes(prevMinutes => {
          if (prevMinutes >= 59) {
            setGameTime(prevTime => {
              const newTime = (prevTime + 1) % 24;
              updateTimeOfDay(newTime);
              updateWeather(newTime);
              onHourlyEffects(newTime);
              
              if (newTime === 6) {
                onEndDay();
              }
              
              return newTime;
            });
            return 0;
          }
          return prevMinutes + 1;
        });
      }, 300);

      return () => clearInterval(timer);
    }
  }, [timePaused]);

  useEffect(() => {
    if (gameTime % 4 === 0) {
      generateWeatherForecast();
    }
  }, [gameTime]);

  const updateTimeOfDay = (time: number) => {
    let newTimeOfDay: TimeOfDay;
    
    if (time >= 5 && time < 10) {
      newTimeOfDay = 'morning';
    } else if (time >= 10 && time < 17) {
      newTimeOfDay = 'day';
    } else if (time >= 17 && time < 21) {
      newTimeOfDay = 'evening';
    } else {
      newTimeOfDay = 'night';
    }
    
    setTimeOfDay(newTimeOfDay);
  };

  const updateWeather = (time: number) => {
    let currentTimeOfDay: TimeOfDay;
    
    if (time >= 5 && time < 10) {
      currentTimeOfDay = 'morning';
    } else if (time >= 10 && time < 17) {
      currentTimeOfDay = 'day';
    } else if (time >= 17 && time < 21) {
      currentTimeOfDay = 'evening';
    } else {
      currentTimeOfDay = 'night';
    }

    const weights: Record<TimeOfDay, Record<WeatherType, number>> = {
      morning: {
        sunny: 0.6,
        cloudy: 0.25,
        rainy: 0.12,
        stormy: 0.03,
        snowy: 0
      },
      day: {
        sunny: 0.7,
        cloudy: 0.2,
        rainy: 0.08,
        stormy: 0.02,
        snowy: 0
      },
      evening: {
        sunny: 0.5,
        cloudy: 0.3,
        rainy: 0.15,
        stormy: 0.05,
        snowy: 0
      },
      night: {
        sunny: 0.1,
        cloudy: 0.6,
        rainy: 0.2,
        stormy: 0.05,
        snowy: 0.05
      }
    };
    
    const weatherWeights = weights[currentTimeOfDay];
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [weatherType, weight] of Object.entries(weatherWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        setWeather(weatherType as WeatherType);
        break;
      }
    }
  };

  const generateWeatherForecast = () => {
    const forecast: WeatherType[] = [...weatherForecast];
    
    if (forecast.length === 0) {
      for (let i = 0; i < 6; i++) {
        const hour = (gameTime + i * 4) % 24;
        forecast.push(getWeatherForTime(hour));
      }
    } else {
      forecast.shift();
      const lastTime = (gameTime + 5 * 4) % 24;
      forecast.push(getWeatherForTime(lastTime));
    }
    
    setWeatherForecast(forecast);
  };

  const getWeatherForTime = (hour: number): WeatherType => {
    let timeOfDay: TimeOfDay;
    if (hour >= 5 && hour < 10) {
      timeOfDay = 'morning';
    } else if (hour >= 10 && hour < 17) {
      timeOfDay = 'day';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    const weights = {
      morning: { sunny: 0.6, cloudy: 0.25, rainy: 0.12, stormy: 0.03, snowy: 0 },
      day: { sunny: 0.7, cloudy: 0.2, rainy: 0.08, stormy: 0.02, snowy: 0 },
      evening: { sunny: 0.5, cloudy: 0.3, rainy: 0.15, stormy: 0.05, snowy: 0 },
      night: { sunny: 0.1, cloudy: 0.6, rainy: 0.2, stormy: 0.05, snowy: 0.05 }
    }[timeOfDay];
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [weatherType, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return weatherType as WeatherType;
      }
    }
    
    return 'cloudy';
  };

  const toggleTimePause = () => {
    setGameMinutes(prev => prev);
  };

  const handleTimeChange = (newTime: number, newTimeOfDay: TimeOfDay) => {
    setGameTime(newTime);
    setTimeOfDay(newTimeOfDay);
  };

  return {
    updateTimeOfDay,
    toggleTimePause,
    handleTimeChange
  };
};