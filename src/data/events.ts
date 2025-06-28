import type { GameEvent } from "../types/game";

export const CITY_EVENTS: GameEvent[] = [
  {
    id: 'first_neighbor_welcome',
    title: 'Welcome Committee 👋',
    description: 'Your first neighbor wants to organize a welcome party for new residents. They\'re asking for your support.',
    options: [
      {
        text: 'Fund a neighborhood BBQ (100 coins)',
        outcome: 'The BBQ is a huge success! Everyone feels more connected and happy.',
        coins: -100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }]
      },
      {
        text: 'Provide basic supplies (50 coins)',
        outcome: 'A modest gathering brings people together. It\'s a nice start.',
        coins: -50,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }]
      },
      {
        text: 'Let them handle it themselves',
        outcome: 'They organize something small on their own. Modest community building.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 5 }]
      }
    ],
    weight: 2,
    minimumDay: 3
  },

  {
    id: 'stray_cat_colony',
    title: 'Stray Cat Colony 🐱',
    description: 'A group of stray cats has made your neighborhood their home. Residents have mixed feelings about them.',
    options: [
      {
        text: 'Start a community cat program (120 coins)',
        outcome: 'Cats are spayed/neutered and cared for. Animal lovers are thrilled, and the cats are healthy.',
        coins: -120,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 10 }]
      },
      {
        text: 'Post adoption notices',
        outcome: 'Some cats find homes, others remain. A decent compromise that most residents accept.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 5 }]
      },
      {
        text: 'Call animal control',
        outcome: 'The cats are removed, but animal lovers are upset about the harsh approach.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -10 }, { neighborId: 2, satisfactionChange: 5 }]
      }
    ],
    weight: 1,
    minimumDay: 4
  },

  {
    id: 'food_truck_festival',
    title: 'Food Truck Festival Request 🚚',
    description: 'Local food truck owners want to organize a weekend festival in your neighborhood. They need permits and space.',
    options: [
      {
        text: 'Sponsor the festival (150 coins)',
        outcome: 'Amazing food, great atmosphere! Everyone loves it and asks when the next one will be.',
        coins: -150,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 18 }, { neighborId: 2, satisfactionChange: 15 }]
      },
      {
        text: 'Allow it with basic permits',
        outcome: 'Good food and fun times. Residents enjoy the variety and community feel.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }, { neighborId: 2, satisfactionChange: 8 }]
      },
      {
        text: 'Deny the permits',
        outcome: 'No festival, but also no crowds or noise. Some residents are disappointed.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -5 }]
      }
    ],
    weight: 1,
    minimumDay: 6
  },

  {
    id: 'neighborhood_watch',
    title: 'Neighborhood Watch Proposal 👮',
    description: 'Residents want to start a neighborhood watch program after hearing about break-ins in nearby areas.',
    options: [
      {
        text: 'Fund security equipment (200 coins)',
        outcome: 'Professional security cameras and lighting make everyone feel much safer.',
        coins: -200,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Organize volunteer patrols',
        outcome: 'Community members take turns watching the neighborhood. Good teamwork and security.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 12 }, { neighborId: 2, satisfactionChange: 10 }]
      },
      {
        text: 'Increase street lighting (100 coins)',
        outcome: 'Better lighting deters crime and makes evening walks safer. Residents appreciate it.',
        coins: -100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }]
      },
      {
        text: 'No action needed',
        outcome: 'Some residents feel you\'re not taking their safety concerns seriously.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -8 }]
      }
    ],
    weight: 1,
    minimumDay: 8
  },

  {
    id: 'community_garden_proposal',
    title: 'Community Garden Initiative 🌱',
    description: 'Green-thumbed residents want to convert an empty lot into a community garden where everyone can grow vegetables.',
    options: [
      {
        text: 'Fund the full garden setup (300 coins)',
        outcome: 'Beautiful raised beds, tools, and a greenhouse! The garden becomes the neighborhood\'s pride.',
        coins: -300,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 25 }, { neighborId: 2, satisfactionChange: 20 }]
      },
      {
        text: 'Provide basic supplies (150 coins)',
        outcome: 'Simple plots and basic tools. The garden grows slowly but surely with community effort.',
        coins: -150,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 12 }]
      },
      {
        text: 'Let them fundraise themselves',
        outcome: 'Residents organize bake sales and fundraisers. It takes longer but builds community spirit.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 8 }]
      },
      {
        text: 'Deny the proposal',
        outcome: 'Environmentally conscious residents are disappointed by the lack of green initiatives.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -12 }]
      }
    ],
    weight: 1,
    minimumDay: 10
  },

  {
    id: 'local_business_dispute',
    title: 'Business License Dispute 🏪',
    description: 'A resident wants to run a small bakery from home, but some neighbors worry about increased traffic and parking issues.',
    options: [
      {
        text: 'Grant license with traffic management (80 coins)',
        outcome: 'Bakery thrives with proper parking solutions. Delicious smells and happy customers!',
        coins: -80,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: -5 }]
      },
      {
        text: 'Allow with limited hours',
        outcome: 'Compromise works well. Bakery operates quietly and neighbors adjust to the schedule.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }, { neighborId: 2, satisfactionChange: 2 }]
      },
      {
        text: 'Deny the license',
        outcome: 'No bakery, but also no traffic issues. The aspiring baker is disappointed.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -15 }, { neighborId: 2, satisfactionChange: 5 }]
      }
    ],
    weight: 1,
    minimumDay: 12
  },

  {
    id: 'developer_buyout_offer',
    title: 'Developer Buyout Offer 🏗️',
    description: 'A big development company wants to buy several properties to build a shopping center. Residents are divided.',
    options: [
      {
        text: 'Support controlled development (negotiate)',
        outcome: 'Balanced development preserves neighborhood character while adding conveniences. Most residents approve.',
        coins: 200,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }, { neighborId: 2, satisfactionChange: 8 }]
      },
      {
        text: 'Block all development',
        outcome: 'Neighborhood stays exactly as is. Preservationists are happy, but some wanted more amenities.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: -8 }]
      },
      {
        text: 'Allow full development',
        outcome: 'Major changes bring jobs and shopping but alter the neighborhood\'s character forever.',
        coins: 500,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -20 }, { neighborId: 2, satisfactionChange: 12 }]
      }
    ],
    weight: 1,
    minimumDay: 15
  },

  {
    id: 'historic_preservation',
    title: 'Historic Building Preservation 🏛️',
    description: 'An old building in your neighborhood might be historically significant. Preservationists want it protected.',
    options: [
      {
        text: 'Fund full restoration (400 coins)',
        outcome: 'Beautiful restoration creates a neighborhood landmark. Tourism and pride increase significantly.',
        coins: -400,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 25 }, { neighborId: 2, satisfactionChange: 20 }]
      },
      {
        text: 'Basic preservation (200 coins)',
        outcome: 'Building is stabilized and protected. History buffs appreciate the effort.',
        coins: -200,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }]
      },
      {
        text: 'Allow private renovation',
        outcome: 'Private developers renovate but change the building\'s character. Mixed reactions.',
        coins: 100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -10 }, { neighborId: 2, satisfactionChange: 5 }]
      },
      {
        text: 'No preservation efforts',
        outcome: 'Building deteriorates further. History and architecture enthusiasts are disappointed.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -15 }]
      }
    ],
    weight: 1,
    minimumDay: 18
  },

  {
    id: 'water_main_break',
    title: 'Water Main Break Emergency! 💧',
    description: 'A major water main has burst, flooding streets and leaving residents without water. Immediate action needed!',
    options: [
      {
        text: 'Emergency repair crews (500 coins)',
        outcome: 'Professional crews fix everything quickly. Residents are grateful for the fast response.',
        coins: -500,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Basic repairs (250 coins)',
        outcome: 'Water is restored but some flooding damage remains. Most residents understand the constraints.',
        coins: -250,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }, { neighborId: 2, satisfactionChange: 8 }]
      },
      {
        text: 'Wait for city utilities',
        outcome: 'Residents are without water for days. They\'re frustrated by the slow response.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -25 }, { neighborId: 2, satisfactionChange: -20 }]
      }
    ],
    weight: 0.3,
    minimumDay: 12
  },

  {
    id: 'power_grid_failure',
    title: 'Neighborhood Blackout! ⚡',
    description: 'A transformer explosion has left the entire neighborhood without power during a heatwave.',
    options: [
      {
        text: 'Rent emergency generators (300 coins)',
        outcome: 'Generators keep essential services running. Residents stay cool and grateful.',
        coins: -300,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 22 }, { neighborId: 2, satisfactionChange: 20 }]
      },
      {
        text: 'Open cooling centers (100 coins)',
        outcome: 'Community centers with backup power become refuges. Good community response.',
        coins: -100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 12 }]
      },
      {
        text: 'Wait for utility company',
        outcome: 'Power is out for days during the heat. Several residents need medical attention.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -30 }, { neighborId: 2, satisfactionChange: -25 }]
      }
    ],
    weight: 0.2,
    minimumDay: 8
  },

  {
    id: 'community_achievement',
    title: 'Community Recognition Award! 🏆',
    description: 'Your neighborhood has been recognized as "Community of the Month" by the city for its outstanding development!',
    options: [
      {
        text: 'Celebrate with a festival (200 coins)',
        outcome: 'Amazing celebration! The whole city comes to see what makes your neighborhood special.',
        coins: -200,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 30 }, { neighborId: 2, satisfactionChange: 25 }]
      },
      {
        text: 'Modest celebration (100 coins)',
        outcome: 'Nice community gathering to celebrate the achievement. Everyone feels proud.',
        coins: -100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Just accept the award',
        outcome: 'Quiet pride in the achievement. Residents appreciate the recognition.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }]
      }
    ],
    weight: 0.5,
    minimumDay: 20
  },

  {
    id: 'surprise_donation',
    title: 'Anonymous Donation! 💝',
    description: 'A grateful former resident has anonymously donated money to improve the neighborhood they once called home.',
    options: [
      {
        text: 'Use for community center upgrades',
        outcome: 'Beautiful new community center becomes the heart of neighborhood activities.',
        coins: 300,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 25 }, { neighborId: 2, satisfactionChange: 20 }]
      },
      {
        text: 'Improve neighborhood infrastructure',
        outcome: 'Better roads, lighting, and utilities make daily life more pleasant for everyone.',
        coins: 250,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Save for emergency fund',
        outcome: 'Wise financial planning. Residents feel secure knowing there\'s money for emergencies.',
        coins: 400,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }]
      }
    ],
    weight: 0.3,
    minimumDay: 15
  },

  {
    id: 'summer_heatwave',
    title: 'Extreme Heatwave Warning! ☀️',
    description: 'Temperatures are expected to reach dangerous levels. Residents, especially elderly ones, need help staying cool.',
    options: [
      {
        text: 'Set up cooling centers (150 coins)',
        outcome: 'Air-conditioned community spaces save lives. Everyone stays safe and comfortable.',
        coins: -150,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Distribute fans and water (80 coins)',
        outcome: 'Basic relief helps people cope. Elderly residents especially appreciate the care.',
        coins: -80,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 12 }, { neighborId: 2, satisfactionChange: 10 }]
      },
      {
        text: 'Issue safety warnings only',
        outcome: 'Some residents struggle with the heat. A few need medical attention.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -10 }, { neighborId: 2, satisfactionChange: -8 }]
      }
    ],
    weight: 0.8,
    minimumDay: 7
  },

  {
    id: 'winter_storm_prep',
    title: 'Winter Storm Approaching! ❄️',
    description: 'A major snowstorm is forecast. The neighborhood needs to prepare for potential power outages and blocked roads.',
    options: [
      {
        text: 'Full emergency preparation (250 coins)',
        outcome: 'Generators, food supplies, and snow removal keep everyone safe and comfortable.',
        coins: -250,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 25 }, { neighborId: 2, satisfactionChange: 22 }]
      },
      {
        text: 'Basic storm supplies (120 coins)',
        outcome: 'Essential supplies help most residents weather the storm successfully.',
        coins: -120,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 12 }]
      },
      {
        text: 'Let residents prepare themselves',
        outcome: 'Some residents are well-prepared, others struggle. Community spirit helps people share resources.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 5 }, { neighborId: 2, satisfactionChange: -5 }]
      }
    ],
    weight: 0.6,
    minimumDay: 10
  },

  {
    id: 'lost_pet_search',
    title: 'Missing Pet Search Party 🐕',
    description: 'A beloved neighborhood dog has gone missing. The whole community wants to help find their furry friend.',
    options: [
      {
        text: 'Organize professional search (100 coins)',
        outcome: 'Search and rescue team finds the dog quickly! Tearful reunion and community celebration.',
        coins: -100,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }, { neighborId: 2, satisfactionChange: 18 }]
      },
      {
        text: 'Coordinate volunteer search',
        outcome: 'Community comes together to search. The dog is found and everyone feels closer.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 12 }]
      },
      {
        text: 'Post flyers only',
        outcome: 'Basic effort helps, but the search takes longer. The dog is eventually found.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 8 }]
      }
    ],
    weight: 1,
    minimumDay: 5
  },

  {
    id: 'talent_show_proposal',
    title: 'Neighborhood Talent Show! 🎭',
    description: 'Residents want to organize a talent show to showcase the amazing skills hidden in your community.',
    options: [
      {
        text: 'Fund a professional stage (180 coins)',
        outcome: 'Incredible performances on a real stage! Hidden talents amaze everyone and build community pride.',
        coins: -180,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 22 }, { neighborId: 2, satisfactionChange: 20 }]
      },
      {
        text: 'Provide basic equipment (80 coins)',
        outcome: 'Simple but fun show brings out creativity. Everyone discovers new talents in their neighbors.',
        coins: -80,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }, { neighborId: 2, satisfactionChange: 12 }]
      },
      {
        text: 'Let them use the community center',
        outcome: 'Informal performances in the community center. Still fun, but limited audience.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: 8 }]
      },
      {
        text: 'No support for the event',
        outcome: 'No talent show happens. Creative residents are disappointed.',
        coins: 0,
        neighborEffects: [{ neighborId: 1, satisfactionChange: -5 }]
      }
    ],
    weight: 1,
    minimumDay: 8
  }
];

export const getRandomEvent = (day: number): GameEvent | null => {
  const availableEvents = CITY_EVENTS.filter(event => 
    !event.minimumDay || day >= event.minimumDay
  );
  
  if (availableEvents.length === 0) return null;
  
  const categories = {
    crisis: availableEvents.filter(e => e.title.includes('Emergency') || e.title.includes('Break') || e.title.includes('Blackout')),
    positive: availableEvents.filter(e => e.title.includes('Award') || e.title.includes('Donation') || e.title.includes('Recognition')),
    community: availableEvents.filter(e => e.title.includes('Committee') || e.title.includes('Garden') || e.title.includes('Watch')),
    business: availableEvents.filter(e => e.title.includes('Business') || e.title.includes('Developer') || e.title.includes('License')),
    seasonal: availableEvents.filter(e => e.title.includes('Heatwave') || e.title.includes('Storm') || e.title.includes('Winter')),
    fun: availableEvents.filter(e => e.title.includes('Pet') || e.title.includes('Talent') || e.title.includes('Festival'))
  };

  let selectedCategory: GameEvent[];
  const rand = Math.random();

  if (day < 10) {
    selectedCategory = rand < 0.5 ? categories.community : categories.fun;
  } else if (day < 20) {
    selectedCategory = rand < 0.4 ? categories.business : 
                     rand < 0.7 ? categories.community : categories.seasonal;
  } else {
    selectedCategory = rand < 0.15 ? categories.crisis :
                     rand < 0.3 ? categories.positive :
                     rand < 0.6 ? categories.business : categories.community;
  }

  if (!selectedCategory || selectedCategory.length === 0) {
    selectedCategory = availableEvents;
  }

  const totalWeight = selectedCategory.reduce((sum, event) => sum + (event.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const event of selectedCategory) {
    random -= (event.weight || 1);
    if (random <= 0) {
      return event;
    }
  }
  
  return selectedCategory[Math.floor(Math.random() * selectedCategory.length)] || null;
};

export const getSeasonalEvent = (season: string, day: number): GameEvent | null => {
  const seasonalEvents: { [key: string]: GameEvent[] } = {
    spring: [
      {
        id: 'spring_cleanup',
        title: 'Spring Cleanup Day 🌸',
        description: 'Residents want to organize a community cleanup day to beautify the neighborhood after winter.',
        options: [
          {
            text: 'Sponsor cleanup supplies (80 coins)',
            outcome: 'The cleanup is a huge success! The city looks beautiful and residents feel proud.',
            coins: -80,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 12 }]
          },
          {
            text: 'Provide volunteer coordination',
            outcome: 'You help organize volunteers. Good turnout and the city looks much better.',
            coins: 0,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 8 }]
          },
          {
            text: 'Let residents handle it themselves',
            outcome: 'Some residents clean up on their own. Modest improvements to the neighborhood.',
            coins: 0,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 3 }]
          }
        ],
        weight: 1,
        minimumDay: 5
      }
    ],
    summer: [
      {
        id: 'summer_festival',
        title: 'Summer Block Party! 🎉',
        description: 'Perfect weather has everyone wanting to celebrate with a big neighborhood block party.',
        options: [
          {
            text: 'Fund live music and food (200 coins)',
            outcome: 'Epic party with great music and food! Everyone has an amazing time.',
            coins: -200,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 25 }, { neighborId: 2, satisfactionChange: 20 }]
          },
          {
            text: 'Basic party supplies (100 coins)',
            outcome: 'Fun party with good food and games. Great community bonding.',
            coins: -100,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 15 }]
          },
          {
            text: 'Let residents organize it',
            outcome: 'Simple but enjoyable gathering. People bring their own food and have fun.',
            coins: 0,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 8 }]
          }
        ],
        weight: 1,
        minimumDay: 8
      }
    ],
    winter: [
      {
        id: 'holiday_decorations',
        title: 'Holiday Light Display 🎄',
        description: 'Residents want to create a spectacular holiday light display to spread cheer and attract visitors.',
        options: [
          {
            text: 'Professional light installation (300 coins)',
            outcome: 'Breathtaking display attracts visitors from across the city! Neighborhood becomes famous.',
            coins: -300,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 30 }, { neighborId: 2, satisfactionChange: 25 }]
          },
          {
            text: 'Community decoration effort (150 coins)',
            outcome: 'Beautiful lights throughout the neighborhood. Residents feel festive and proud.',
            coins: -150,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 20 }]
          },
          {
            text: 'Individual house decorations',
            outcome: 'Some houses look great, others don\'t participate. Mixed but festive atmosphere.',
            coins: 0,
            neighborEffects: [{ neighborId: 1, satisfactionChange: 10 }]
          }
        ],
        weight: 1,
        minimumDay: 10
      }
    ]
  };
  
  const events = seasonalEvents[season];
  if (!events || events.length === 0) return null;
  
  const availableEvents = events.filter(event => 
    !event.minimumDay || day >= event.minimumDay
  );
  
  if (availableEvents.length === 0) return null;
  
  return availableEvents[Math.floor(Math.random() * availableEvents.length)];
};