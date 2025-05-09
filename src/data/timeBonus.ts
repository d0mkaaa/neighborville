import type { TimeBasedBonus } from "../types/game";

export const timeBasedBonuses: TimeBasedBonus[] = [
  {
    buildingId: 'cafe',
    timeOfDay: 'morning',
    incomeMultiplier: 1.5,
    happinessMultiplier: 1.2
  },
  {
    buildingId: 'music_venue',
    timeOfDay: 'evening',
    incomeMultiplier: 2.0,
    happinessMultiplier: 1.5
  },
  {
    buildingId: 'park',
    timeOfDay: 'day',
    happinessMultiplier: 1.3
  },
  {
    buildingId: 'library',
    timeOfDay: 'evening',
    happinessMultiplier: 1.4
  },
  {
    buildingId: 'house',
    timeOfDay: 'night',
    happinessMultiplier: 1.2
  },
  {
    buildingId: 'apartment',
    timeOfDay: 'night',
    happinessMultiplier: 1.3
  },
  {
    buildingId: 'solar_panel',
    timeOfDay: 'day',
    incomeMultiplier: 1.5
  },
  {
    buildingId: 'charging_station',
    timeOfDay: 'day',
    incomeMultiplier: 1.2
  }
];