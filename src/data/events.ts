import type { GameEvent } from "../types/game";

export const possibleEvents: GameEvent[] = [
  { 
    id: 'block_party', 
    title: 'Block Party!', 
    description: 'Your neighbors want to organize a block party. Will you contribute to make it happen?',
    options: [
      { text: 'Definitely! (100 coins)', outcome: 'Your contribution made the party a huge success! Neighborhood happiness increases.', coins: -100, happiness: 15 },
      { text: 'I\'ll attend but not fund', outcome: 'You enjoyed the party but some neighbors noticed your lack of contribution.', coins: 0, happiness: 5 },
      { text: 'Skip it', outcome: 'Neighbors are disappointed by your absence. Community spirit decreases.', coins: 0, happiness: -10 }
    ]
  },
  { 
    id: 'tree_planting', 
    title: 'Community Tree Planting', 
    description: 'A local group is organizing a tree planting day. How would you like to participate?',
    options: [
      { text: 'Donate trees (150 coins)', outcome: 'Your donation beautified the neighborhood! Everyone appreciates the new greenery.', coins: -150, happiness: 20 },
      { text: 'Volunteer time only', outcome: 'Your help was valuable! The day was a success.', coins: 0, happiness: 10 },
      { text: 'Not interested', outcome: 'The event happened without you. Some neighbors question your commitment.', coins: 0, happiness: -5 }
    ]
  },
  { 
    id: 'power_outage', 
    title: 'Neighborhood Power Outage', 
    description: 'A storm caused a power outage! How will you respond?',
    options: [
      { text: 'Share your generator', outcome: 'Neighbors are grateful for your help during the crisis. Community bonds strengthen!', coins: 0, happiness: 25 },
      { text: 'Check on elderly neighbors', outcome: 'Your concern for vulnerable neighbors is appreciated. You made a difference!', coins: 0, happiness: 15 },
      { text: 'Stay home and wait', outcome: 'While understandable, some neighbors needed help. Community connection decreased.', coins: 0, happiness: -8 }
    ]
  }
];