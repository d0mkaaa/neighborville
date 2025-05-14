import type { Season, SeasonalEvent, SeasonalBonus } from "../types/game";

export const SEASONS: Season[] = [
  {
    id: "spring",
    name: "Spring",
    description: "Flowers bloom and the town comes alive. Gardens thrive during this season.",
    icon: "🌸",
    colorTheme: "#a5d6a7",
    durationDays: 30,
    startDay: 1,
    bonuses: [
      {
        type: "happiness",
        amount: 5,
        description: "The pleasant weather improves everyone's mood"
      },
      {
        type: "garden",
        amount: 20,
        description: "Gardens and parks produce 20% more income"
      }
    ]
  },
  {
    id: "summer",
    name: "Summer",
    description: "The hot season brings tourists and beach activities. Entertainment venues flourish.",
    icon: "☀️",
    colorTheme: "#ffca28",
    durationDays: 30,
    startDay: 31,
    bonuses: [
      {
        type: "tourism",
        amount: 15,
        description: "Entertainment buildings earn 15% more"
      },
      {
        type: "energy",
        amount: -10,
        description: "Energy usage increases by 10% due to cooling needs"
      }
    ]
  },
  {
    id: "autumn",
    name: "Autumn",
    description: "Colorful leaves and harvest festivals. Commercial buildings see increased activity.",
    icon: "🍂",
    colorTheme: "#e65100",
    durationDays: 30,
    startDay: 61,
    bonuses: [
      {
        type: "commercial",
        amount: 10,
        description: "Commercial buildings earn 10% more income"
      },
      {
        type: "education",
        amount: 15,
        description: "Educational buildings provide 15% more happiness"
      }
    ]
  },
  {
    id: "winter",
    name: "Winter",
    description: "Snowy days and holiday celebrations. Residential buildings gain bonuses.",
    icon: "❄️",
    colorTheme: "#90caf9",
    durationDays: 30,
    startDay: 91,
    bonuses: [
      {
        type: "residential",
        amount: 10,
        description: "Residential buildings provide 10% more happiness"
      },
      {
        type: "energy",
        amount: 15,
        description: "Energy usage increases by 15% due to heating needs"
      }
    ]
  }
];

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  // spring events
  {
    id: "spring_festival",
    name: "Spring Festival",
    description: "A celebration of new beginnings with colorful decorations throughout the town.",
    season: "spring",
    icon: "🎏",
    duration: 3,
    triggerDayInSeason: 15,
    bonuses: [
      {
        type: "happiness",
        amount: 15,
        description: "Town-wide happiness boost"
      },
      {
        type: "income",
        amount: 10,
        description: "Increased visitor spending"
      }
    ],
    options: [
      {
        id: "sponsor",
        name: "Sponsor Activities",
        cost: 500,
        reward: {
          type: "happiness",
          amount: 10
        }
      },
      {
        id: "decorations",
        name: "Special Decorations",
        cost: 300,
        reward: {
          type: "income",
          amount: 200
        }
      }
    ]
  },
  {
    id: "garden_competition",
    name: "Garden Competition",
    description: "Residents compete to create the most beautiful gardens.",
    season: "spring",
    icon: "🌷",
    duration: 5,
    triggerDayInSeason: 25,
    bonuses: [
      {
        type: "garden",
        amount: 30,
        description: "Garden productivity greatly increased"
      }
    ],
    options: [
      {
        id: "prize",
        name: "Offer Cash Prize",
        cost: 400,
        reward: {
          type: "experience",
          amount: 50
        }
      }
    ]
  },
  
  // summer events
  {
    id: "summer_fair",
    name: "Summer Fair",
    description: "A large fair with rides, games, and food stands.",
    season: "summer",
    icon: "🎡",
    duration: 7,
    triggerDayInSeason: 10,
    bonuses: [
      {
        type: "income",
        amount: 20,
        description: "Significant income boost from visitors"
      },
      {
        type: "happiness",
        amount: 20,
        description: "Everyone loves the fair!"
      }
    ],
    options: [
      {
        id: "expand",
        name: "Expand Fair Grounds",
        cost: 800,
        reward: {
          type: "income",
          amount: 500
        }
      },
      {
        id: "fireworks",
        name: "Add Fireworks Show",
        cost: 600,
        reward: {
          type: "happiness",
          amount: 15
        }
      }
    ]
  },
  {
    id: "heat_wave",
    name: "Heat Wave",
    description: "A period of extremely hot weather affecting the town.",
    season: "summer",
    icon: "🔥",
    duration: 4,
    triggerDayInSeason: 22,
    bonuses: [
      {
        type: "energy",
        amount: -20,
        description: "Energy consumption increases significantly"
      },
      {
        type: "happiness",
        amount: -5,
        description: "The heat makes everyone uncomfortable"
      }
    ],
    options: [
      {
        id: "cooling",
        name: "Set Up Cooling Centers",
        cost: 500,
        reward: {
          type: "happiness",
          amount: 10
        }
      },
      {
        id: "water",
        name: "Distribute Water",
        cost: 300,
        reward: {
          type: "reputation",
          amount: 10
        }
      }
    ]
  },
  
  // autumn events
  {
    id: "harvest_festival",
    name: "Harvest Festival",
    description: "A celebration of the autumn harvest with food and activities.",
    season: "autumn",
    icon: "🍎",
    duration: 5,
    triggerDayInSeason: 15,
    bonuses: [
      {
        type: "commercial",
        amount: 15,
        description: "Commercial buildings see increased activity"
      },
      {
        type: "happiness",
        amount: 10,
        description: "Festival activities boost town morale"
      }
    ],
    options: [
      {
        id: "contest",
        name: "Host Cooking Contest",
        cost: 400,
        reward: {
          type: "income",
          amount: 300
        }
      },
      {
        id: "parade",
        name: "Organize Harvest Parade",
        cost: 600,
        reward: {
          type: "happiness",
          amount: 15
        }
      }
    ]
  },
  {
    id: "back_to_school",
    name: "Back to School",
    description: "Students return to school after summer break.",
    season: "autumn",
    icon: "📚",
    duration: 7,
    triggerDayInSeason: 5,
    bonuses: [
      {
        type: "education",
        amount: 25,
        description: "Educational buildings function at peak efficiency"
      },
      {
        type: "commercial",
        amount: 15,
        description: "School supplies boost commercial income"
      }
    ],
    options: [
      {
        id: "supplies",
        name: "Donate School Supplies",
        cost: 400,
        reward: {
          type: "reputation",
          amount: 15
        }
      },
      {
        id: "scholarship",
        name: "Create Scholarship Fund",
        cost: 1000,
        reward: {
          type: "education",
          amount: 20
        }
      }
    ]
  },
  
  // winter events
  {
    id: "winter_festival",
    name: "Winter Festival",
    description: "A celebration with lights, decorations, and winter activities.",
    season: "winter",
    icon: "🎄",
    duration: 7,
    triggerDayInSeason: 20,
    bonuses: [
      {
        type: "happiness",
        amount: 20,
        description: "Festival festivities boost happiness significantly"
      },
      {
        type: "income",
        amount: 15,
        description: "Holiday shopping increases town income"
      }
    ],
    options: [
      {
        id: "lights",
        name: "Special Light Display",
        cost: 600,
        reward: {
          type: "happiness",
          amount: 15
        }
      },
      {
        id: "market",
        name: "Holiday Market",
        cost: 800,
        reward: {
          type: "income",
          amount: 500
        }
      }
    ]
  },
  {
    id: "snowstorm",
    name: "Snowstorm",
    description: "A heavy snowfall that affects the town's infrastructure.",
    season: "winter",
    icon: "🌨️",
    duration: 3,
    triggerDayInSeason: 10,
    bonuses: [
      {
        type: "energy",
        amount: -25,
        description: "Energy consumption increases dramatically"
      },
      {
        type: "income",
        amount: -10,
        description: "Reduced mobility affects business"
      }
    ],
    options: [
      {
        id: "clearing",
        name: "Snow Clearing Services",
        cost: 700,
        reward: {
          type: "income",
          amount: 300
        }
      },
      {
        id: "emergency",
        name: "Emergency Services",
        cost: 500,
        reward: {
          type: "reputation",
          amount: 20
        }
      }
    ]
  }
];

export function getCurrentSeason(day: number): Season {
  const adjustedDay = ((day - 1) % 120) + 1; 
  
  return SEASONS.find(season => 
    adjustedDay >= season.startDay && 
    adjustedDay < season.startDay + season.durationDays
  ) || SEASONS[0];
}

export function getSeasonalEvents(season: string): SeasonalEvent[] {
  return SEASONAL_EVENTS.filter(event => event.season === season);
}

export function checkForSeasonalEvent(day: number, currentSeason: Season): SeasonalEvent | null {
  const dayInSeason = ((day - currentSeason.startDay) % currentSeason.durationDays) + 1;
  
  return SEASONAL_EVENTS.find(event => 
    event.season === currentSeason.id && 
    event.triggerDayInSeason === dayInSeason
  ) || null;
}

export function calculateSeasonalBonuses(
  season: Season, 
  building: { type?: string; income: number; happiness: number }
): { incomeBonus: number; happinessBonus: number; energyBonus: number } {
  let incomeBonus = 0;
  let happinessBonus = 0;
  let energyBonus = 0;
  
  season.bonuses.forEach(bonus => {
    if (bonus.type === 'happiness') {
      happinessBonus += bonus.amount;
    } else if (bonus.type === 'energy') {
      energyBonus += bonus.amount;
    } else if (
      (bonus.type === 'garden' && building.type === 'park') ||
      (bonus.type === 'tourism' && building.type === 'entertainment') ||
      (bonus.type === 'commercial' && building.type === 'commercial') ||
      (bonus.type === 'residential' && building.type === 'residential') ||
      (bonus.type === 'education' && building.type === 'education')
    ) {
      incomeBonus += (building.income * bonus.amount) / 100;
      happinessBonus += (building.happiness * bonus.amount) / 200;
    }
  });
  
  return { incomeBonus, happinessBonus, energyBonus };
}
