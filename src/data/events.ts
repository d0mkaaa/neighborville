import type { GameEvent } from "../types/game";

export const CITY_EVENTS: GameEvent[] = [
  {
    id: 'block_party',
    title: 'Neighborhood Block Party! 🎉',
    description: 'Your neighbors want to organize a block party. The community is excited but needs your support to make it happen. How will you respond?',
    options: [
      {
        text: 'Fund the entire party! (100 coins)',
        outcome: 'The block party is a huge success! Residents are thrilled with your generosity and community spirit.',
        coins: -100,
        communitySatisfaction: 15,
        publicTrustChange: 8,
        mediaAttention: 'positive'
      },
      {
        text: 'Provide basic support (50 coins)',
        outcome: 'You contribute to the block party. Residents appreciate your involvement in community events.',
        coins: -50,
        communitySatisfaction: 8,
        publicTrustChange: 3
      },
      {
        text: 'Attend but don\'t fund',
        outcome: 'You show up and mingle with residents. They appreciate your presence even without financial support.',
        coins: 0,
        communitySatisfaction: 3,
        publicTrustChange: 1
      },
      {
        text: 'Skip it entirely',
        outcome: 'Residents notice your absence and feel you don\'t care about community events. Some are disappointed.',
        coins: 0,
        communitySatisfaction: -8,
        publicTrustChange: -5,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 3
  },
  {
    id: 'water_main_break',
    title: 'Emergency: Water Main Break! 💧',
    description: 'A major water main has burst downtown, flooding the street and disrupting service to several buildings. Residents demand immediate action!',
    options: [
      {
        text: 'Emergency repair crew (200 coins)',
        outcome: 'Professional repair crew fixes the break within hours. Residents praise your quick response.',
        coins: -200,
        communitySatisfaction: 12,
        serviceBudgetImpact: [{ serviceId: 'water_system', efficiencyChange: 5 }],
        publicTrustChange: 10,
        mediaAttention: 'positive'
      },
      {
        text: 'Standard repair (100 coins)',
        outcome: 'City workers fix the break by end of day. Some residents are frustrated by the delay but appreciate the fix.',
        coins: -100,
        communitySatisfaction: 5,
        publicTrustChange: 2
      },
      {
        text: 'Delay repairs to save money',
        outcome: 'The broken main continues flooding for days. Residents are angry about the water damage and lack of service.',
        coins: 0,
        communitySatisfaction: -20,
        serviceBudgetImpact: [{ serviceId: 'water_system', efficiencyChange: -10 }],
        publicTrustChange: -15,        mediaAttention: 'negative',
        infraRepairCost: 350
      }
    ],
    weight: 1,
    minimumDay: 5,
    timeOfDay: 'day'
  },
  {
    id: 'festival_proposal',
    title: 'Annual City Festival Proposal 🎪',
    description: 'The chamber of commerce wants to host a city-wide festival to boost tourism and local business. They need permits and city support.',
    options: [
      {
        text: 'Full festival sponsorship (300 coins)',
        outcome: 'The festival is spectacular! Tourism booms, local businesses thrive, and the city gains national attention.',
        coins: -300,
        communitySatisfaction: 20,
        landValueChange: 15,
        publicTrustChange: 12,
        mediaAttention: 'positive'
      },
      {
        text: 'Partial support (150 coins)',
        outcome: 'A modest festival happens. Residents enjoy it and local businesses see some increased traffic.',
        coins: -150,
        communitySatisfaction: 10,
        landValueChange: 5,
        publicTrustChange: 5
      },
      {
        text: 'Approve permits only (free)',
        outcome: 'A small community-organized festival takes place. Residents appreciate the effort despite limited funds.',
        coins: 0,
        communitySatisfaction: 5,
        publicTrustChange: 2
      },
      {
        text: 'Deny the festival',
        outcome: 'Local businesses are disappointed and residents feel the city lacks community spirit.',
        coins: 0,
        communitySatisfaction: -12,
        landValueChange: -5,
        publicTrustChange: -8,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 10
  },
  {
    id: 'power_grid_overload',
    title: 'Power Grid Overload! ⚡',
    description: 'The city\'s power grid is struggling with increased demand. Rolling blackouts are affecting residents and businesses.',
    options: [
      {
        text: 'Emergency generator rental (250 coins)',
        outcome: 'Temporary generators restore power immediately. Residents are relieved but question long-term planning.',
        coins: -250,
        communitySatisfaction: 8,
        serviceBudgetImpact: [{ serviceId: 'power_grid', efficiencyChange: 3 }],
        publicTrustChange: 5
      },
      {
        text: 'Upgrade power infrastructure (400 coins)',
        outcome: 'Major infrastructure investment solves the problem permanently. Residents praise your foresight.',
        coins: -400,
        communitySatisfaction: 18,
        serviceBudgetImpact: [{ serviceId: 'power_grid', efficiencyChange: 15 }],
        publicTrustChange: 15,
        mediaAttention: 'positive'
      },
      {
        text: 'Implement rolling blackouts',
        outcome: 'Scheduled outages manage demand but frustrate residents and hurt local businesses.',
        coins: 0,
        communitySatisfaction: -15,
        serviceBudgetImpact: [{ serviceId: 'power_grid', efficiencyChange: -5 }],
        publicTrustChange: -10,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 7
  },
  {
    id: 'street_art_controversy',
    title: 'Street Art Controversy 🎨',
    description: 'Local artists have created murals downtown. Some residents love them, others call them graffiti. The city council wants your decision.',
    options: [
      {
        text: 'Commission official murals (180 coins)',
        outcome: 'You hire the artists for official city beautification. The murals become a tourist attraction!',
        coins: -180,
        communitySatisfaction: 15,
        landValueChange: 10,
        publicTrustChange: 8,
        mediaAttention: 'positive'
      },
      {
        text: 'Allow the existing art',
        outcome: 'You let the murals stay. Young residents are happy, though some older residents grumble.',
        coins: 0,
        communitySatisfaction: 5,
        landValueChange: 3,
        publicTrustChange: 2
      },
      {
        text: 'Paint over everything (50 coins)',
        outcome: 'The murals are removed. Conservative residents approve but artists and youth are disappointed.',
        coins: -50,
        communitySatisfaction: -8,
        landValueChange: -2,
        publicTrustChange: -5,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 8
  },
  {
    id: 'food_truck_invasion',
    title: 'Food Truck Festival! 🚚',
    description: 'Dozens of food trucks want to set up for a weekend festival. Local restaurants are worried about competition.',
    options: [
      {
        text: 'Welcome all food trucks (permit fees: +150 coins)',
        outcome: 'The food truck festival is a hit! Residents love the variety and the city earns permit revenue.',
        coins: 150,
        communitySatisfaction: 12,
        landValueChange: 5,
        publicTrustChange: 8
      },
      {
        text: 'Limited trucks to protect restaurants',
        outcome: 'A smaller festival happens. Both restaurants and food truck fans are somewhat satisfied.',
        coins: 50,
        communitySatisfaction: 6,
        publicTrustChange: 3
      },
      {
        text: 'Ban all food trucks',
        outcome: 'Local restaurants are pleased but residents feel the city is too restrictive and boring.',
        coins: 0,
        communitySatisfaction: -10,
        publicTrustChange: -6,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 6
  },
  {
    id: 'pothole_crisis',
    title: 'The Great Pothole Crisis! 🕳️',
    description: 'Winter has left the roads full of potholes. Residents are complaining about car damage and the unsightly streets.',
    options: [
      {
        text: 'Complete road resurfacing (350 coins)',
        outcome: 'All roads are perfectly repaired. Residents are thrilled with the smooth streets and professional job.',
        coins: -350,
        communitySatisfaction: 20,
        serviceBudgetImpact: [{ serviceId: 'transportation', efficiencyChange: 10 }],
        publicTrustChange: 12,
        mediaAttention: 'positive'
      },
      {
        text: 'Patch the worst holes (120 coins)',
        outcome: 'The most dangerous potholes are fixed. Residents appreciate the effort but note many remain.',
        coins: -120,
        communitySatisfaction: 8,
        serviceBudgetImpact: [{ serviceId: 'transportation', efficiencyChange: 3 }],
        publicTrustChange: 4
      },
      {
        text: 'Community volunteer day (free)',
        outcome: 'Residents pitch in to help fix roads. Community spirit is high despite the amateur repairs.',
        coins: 0,
        communitySatisfaction: 10,
        publicTrustChange: 8
      },
      {
        text: 'Ignore the problem',
        outcome: 'Potholes get worse, damaging more cars. Residents are increasingly frustrated with city management.',
        coins: 0,
        communitySatisfaction: -18,
        serviceBudgetImpact: [{ serviceId: 'transportation', efficiencyChange: -8 }],
        publicTrustChange: -12,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 12
  },
  {
    id: 'recycling_program',
    title: 'Green Initiative: Recycling Program ♻️',
    description: 'Environmental groups propose a city-wide recycling program. It would help the environment but requires investment and resident participation.',
    options: [
      {
        text: 'Full recycling program (200 coins)',
        outcome: 'Comprehensive recycling launches successfully. The city becomes a model for environmental responsibility.',
        coins: -200,
        communitySatisfaction: 15,
        serviceBudgetImpact: [{ serviceId: 'environment', efficiencyChange: 12 }],
        pollutionChange: -15,
        publicTrustChange: 10,
        mediaAttention: 'positive'
      },
      {
        text: 'Basic recycling (100 coins)',
        outcome: 'A simple recycling program starts. Some residents participate and appreciate the environmental effort.',
        coins: -100,
        communitySatisfaction: 8,
        serviceBudgetImpact: [{ serviceId: 'environment', efficiencyChange: 5 }],
        pollutionChange: -5,
        publicTrustChange: 5
      },
      {
        text: 'Encourage voluntary recycling (free)',
        outcome: 'You promote recycling without funding. A few dedicated residents start recycling on their own.',
        coins: 0,
        communitySatisfaction: 3,
        pollutionChange: -2
      },
      {
        text: 'Reject the proposal',
        outcome: 'Environmental groups are disappointed. Some residents question the city\'s commitment to the future.',
        coins: 0,
        communitySatisfaction: -8,
        pollutionChange: 2,
        publicTrustChange: -5,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 9
  },
  {
    id: 'noise_complaint',
    title: 'Noise Complaint Drama 📢',
    description: 'A new entertainment district is bringing life to downtown, but some residents complain about noise levels late at night.',
    options: [
      {
        text: 'Install sound barriers (150 coins)',
        outcome: 'Professional sound barriers reduce noise while keeping the entertainment district thriving.',
        coins: -150,
        communitySatisfaction: 12,
        landValueChange: 5,
        publicTrustChange: 8
      },
      {
        text: 'Implement quiet hours',
        outcome: 'New noise ordinances balance entertainment and residential needs. Most residents are satisfied.',
        coins: 0,
        communitySatisfaction: 6,
        publicTrustChange: 4
      },
      {
        text: 'Side with entertainment venues',
        outcome: 'Businesses thrive but some residential areas become noisier. Mixed reactions from residents.',
        coins: 0,
        communitySatisfaction: -3,
        landValueChange: 8,
        publicTrustChange: -2
      },
      {
        text: 'Shut down late-night venues',
        outcome: 'Quiet returns but the entertainment district dies. Business owners and young residents are angry.',
        coins: 0,
        communitySatisfaction: -12,
        landValueChange: -10,
        publicTrustChange: -8,
        mediaAttention: 'negative'
      }
    ],
    weight: 1,
    minimumDay: 15
  },
  {
    id: 'budget_crisis',
    title: 'City Budget Crisis! 💰',
    description: 'Unexpected expenses have strained the city budget. You need to make tough decisions to balance the books.',
    options: [
      {
        text: 'Emergency tax increase',
        outcome: 'Higher taxes solve the budget crisis but residents are unhappy about the financial burden.',
        coins: 300,
        communitySatisfaction: -15,
        publicTrustChange: -10,
        mediaAttention: 'negative'
      },
      {
        text: 'Cut non-essential services',
        outcome: 'Budget balanced through service cuts. Some residents notice reduced quality but understand necessity.',
        coins: 150,
        communitySatisfaction: -8,
        serviceBudgetImpact: [
          { serviceId: 'education', efficiencyChange: -5 },
          { serviceId: 'environment', efficiencyChange: -5 }
        ],
        publicTrustChange: -3
      },
      {
        text: 'Take emergency loan (debt)',
        outcome: 'Immediate crisis resolved but the city now has debt payments. Services continue normally.',
        coins: 250,
        communitySatisfaction: 2,
        publicTrustChange: -5
      },
      {
        text: 'Ask for federal assistance',
        outcome: 'State government provides emergency funding. Residents are relieved but some question city management.',
        coins: 200,
        communitySatisfaction: 5,
        publicTrustChange: -8,
        mediaAttention: 'neutral'
      }
    ],
    weight: 1,
    minimumDay: 20
  }
];

export const getRandomEvent = (day: number): GameEvent | null => {
  const availableEvents = CITY_EVENTS.filter(event => 
    !event.minimumDay || day >= event.minimumDay
  );
  
  if (availableEvents.length === 0) return null;
  
  const totalWeight = availableEvents.reduce((sum, event) => sum + (event.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const event of availableEvents) {
    random -= (event.weight || 1);
    if (random <= 0) {
      return event;
    }
  }
  
  return availableEvents[0];
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
            communitySatisfaction: 12,
            landValueChange: 8,
            publicTrustChange: 6
          },
          {
            text: 'Provide volunteer coordination',
            outcome: 'You help organize volunteers. Good turnout and the city looks much better.',
            coins: 0,
            communitySatisfaction: 8,
            landValueChange: 4,
            publicTrustChange: 4
          },
          {
            text: 'Let residents handle it themselves',
            outcome: 'Some residents clean up on their own. Modest improvements to the neighborhood.',
            coins: 0,
            communitySatisfaction: 3,
            landValueChange: 1
          }
        ],
        weight: 1,
        minimumDay: 5
      }
    ],
    winter: [
      {
        id: 'snow_emergency',
        title: 'Snow Emergency! ❄️',
        description: 'A major snowstorm has hit the city. Roads need plowing and residents need help.',
        options: [
          {
            text: 'Emergency snow removal (200 coins)',
            outcome: 'Professional crews clear all roads quickly. Essential services continue and residents are grateful.',
            coins: -200,
            communitySatisfaction: 15,
            serviceBudgetImpact: [{ serviceId: 'transportation', efficiencyChange: 5 }],
            publicTrustChange: 10
          },
          {
            text: 'Basic snow clearing (100 coins)',
            outcome: 'Main roads are cleared but side streets remain snowy. Most residents understand the priority.',
            coins: -100,
            communitySatisfaction: 6,
            publicTrustChange: 3
          },
          {
            text: 'Wait for natural melting',
            outcome: 'The city remains snowed in for days. Residents are frustrated and some can\'t get to work.',
            coins: 0,
            communitySatisfaction: -20,
            publicTrustChange: -15,
            mediaAttention: 'negative'
          }
        ],
        weight: 1,
        minimumDay: 3
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