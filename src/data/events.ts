import type { GameEvent } from "../types/game";

export const possibleEvents: GameEvent[] = [
  { 
    id: 'block_party', 
    title: 'block party!', 
    description: 'your neighbors want to organize a block party. will you contribute to make it happen?',
    options: [
      { 
        text: 'definitely! (100 coins)', 
        outcome: 'your contribution made the party a huge success! neighborhood happiness increases.', 
        coins: -100, 
        happiness: 15 
      },
      { 
        text: 'i\'ll attend but not fund', 
        outcome: 'you enjoyed the party but some neighbors noticed your lack of contribution.', 
        coins: 0, 
        happiness: 5 
      },
      { 
        text: 'skip it', 
        outcome: 'neighbors are disappointed by your absence. community spirit decreases.', 
        coins: 0, 
        happiness: -10 
      }
    ],
    weight: 1,
    minimumDay: 3
  },
  { 
    id: 'tree_planting', 
    title: 'community tree planting', 
    description: 'a local group is organizing a tree planting day. how would you like to participate?',
    options: [
      { 
        text: 'donate trees (150 coins)', 
        outcome: 'your donation beautified the neighborhood! everyone appreciates the new greenery.', 
        coins: -150, 
        happiness: 20 
      },
      { 
        text: 'volunteer time only', 
        outcome: 'your help was valuable! the day was a success.', 
        coins: 0, 
        happiness: 10 
      },
      { 
        text: 'not interested', 
        outcome: 'the event happened without you. some neighbors question your commitment.', 
        coins: 0, 
        happiness: -5 
      }
    ],
    weight: 1,
    minimumDay: 6
  },
  { 
    id: 'power_outage', 
    title: 'neighborhood power outage', 
    description: 'a storm caused a power outage! how will you respond?',
    options: [
      { 
        text: 'share your generator', 
        outcome: 'neighbors are grateful for your help during the crisis. community bonds strengthen!', 
        coins: 0, 
        happiness: 25 
      },
      { 
        text: 'check on elderly neighbors', 
        outcome: 'your concern for vulnerable neighbors is appreciated. you made a difference!', 
        coins: 0, 
        happiness: 15 
      },
      { 
        text: 'stay home and wait', 
        outcome: 'while understandable, some neighbors needed help. community connection decreased.', 
        coins: 0, 
        happiness: -8 
      }
    ],
    weight: 1,
    minimumDay: 10
  },
  
  {
    id: 'noise_complaint',
    title: 'late night music party',
    description: 'neighbors are having a loud music party at 2 am. it\'s affecting everyone\'s sleep.',
    options: [
      { 
        text: 'organize a community discussion', 
        outcome: 'everyone reached an understanding! quiet hours established.', 
        coins: 0, 
        happiness: 10,
        neighborEffects: [
          { happinessChange: -15 },
          { neighborId: 2, happinessChange: 5 },
          { neighborId: 6, happinessChange: -20 }
        ]
      },
      { 
        text: 'issue a formal warning', 
        outcome: 'the music stops but creates tension between residents.', 
        coins: 0, 
        happiness: -5,
        neighborEffects: [
          { happinessChange: -25 },
          { neighborId: 9, happinessChange: -30 }
        ]
      },
      { 
        text: 'ignore the complaints', 
        outcome: 'sleep-deprived residents are frustrated. some are considering moving out.', 
        coins: 0, 
        happiness: 0,
        neighborEffects: [
          { happinessChange: -30 },
          { neighborId: 1, happinessChange: -40 },
          { neighborId: 3, happinessChange: -35 }
        ]
      }
    ],
    weight: 1,
    minimumDay: 7,
    affectedNeighbors: [1, 2, 3, 6, 9]
  },
  {
    id: 'apartment_crowding',
    title: 'overcrowded apartments',
    description: 'residents are complaining about apartments being too crowded. tensions are rising.',
    options: [
      { 
        text: 'build more apartments', 
        outcome: 'space issues resolved! residents are happier with more personal space.', 
        coins: -400, 
        happiness: 15,
        neighborEffects: [
          { happinessChange: 20 }
        ]
      },
      { 
        text: 'create community spaces', 
        outcome: 'shared spaces help reduce feelings of being cramped.', 
        coins: -200, 
        happiness: 10,
        neighborEffects: [
          { happinessChange: 10 }
        ]
      },
      { 
        text: 'do nothing', 
        outcome: 'overcrowding persists. apartment dwellers become increasingly unhappy.', 
        coins: 0, 
        happiness: -10,
        neighborEffects: [
          { happinessChange: -40 }
        ]
      }
    ],
    weight: 1,
    minimumDay: 20
  },
  {
    id: 'house_vs_apartment',
    title: 'housing preference conflict',
    description: 'some neighbors want private houses, others prefer apartments. the debate is getting heated.',
    options: [
      { 
        text: 'build more houses', 
        outcome: 'house lovers are happy, but apartment dwellers feel neglected.', 
        coins: -600, 
        happiness: 5,
        neighborEffects: [
          { happinessChange: 25 },
          { happinessChange: -15 }
        ]
      },
      { 
        text: 'build more apartments', 
        outcome: 'apartment supporters are pleased, but house lovers complain.', 
        coins: -800, 
        happiness: 5,
        neighborEffects: [
          { happinessChange: -15 },
          { happinessChange: 25 }
        ]
      },
      { 
        text: 'compromise with mixed development', 
        outcome: 'balanced approach satisfies most residents.', 
        coins: -700, 
        happiness: 15,
        neighborEffects: [
          { happinessChange: 10 }
        ]
      }
    ],
    weight: 1,
    minimumDay: 15
  },
  {
    id: 'viral_challenge',
    title: 'the neighborhood challenge',
    description: 'residents want to participate in the latest viral dance challenge to put your neighborhood on the map.',
    options: [
      { 
        text: 'organize a massive group version', 
        outcome: 'the video went viral! #neighborvillechallenge is trending.', 
        coins: 100, 
        happiness: 25 
      },
      { 
        text: 'allow but don\'t participate', 
        outcome: 'some fun videos were made but nothing got serious traction.', 
        coins: 0, 
        happiness: 10 
      },
      { 
        text: 'ban it as too disruptive', 
        outcome: 'neighboring communities all went viral while yours stayed offline. major fomo ensued.', 
        coins: 0, 
        happiness: -15 
      }
    ],
    weight: 0.7,
    minimumDay: 12
  }
];

export const getRandomEvent = (currentDay: number): GameEvent | null => {
  const eligibleEvents = possibleEvents.filter(event => 
    event.minimumDay && event.minimumDay <= currentDay
  );
  
  if (eligibleEvents.length === 0) return null;
  
  const totalWeight = eligibleEvents.reduce((sum, event) => sum + (event.weight || 1), 0);
  
  let randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  
  for (const event of eligibleEvents) {
    cumulativeWeight += event.weight || 1;
    if (randomValue <= cumulativeWeight) {
      return event;
    }
  }

  return eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
};