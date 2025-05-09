import type { GameEvent } from "../types/game";

export const possibleEvents: GameEvent[] = [
  { 
    id: 'block_party', 
    title: 'block party!', 
    description: 'your neighbors want to organize a block party. will you contribute to make it happen?',
    options: [
      { text: 'definitely! (100 coins)', outcome: 'your contribution made the party a huge success! neighborhood happiness increases.', coins: -100, happiness: 15 },
      { text: 'i\'ll attend but not fund', outcome: 'you enjoyed the party but some neighbors noticed your lack of contribution.', coins: 0, happiness: 5 },
      { text: 'skip it', outcome: 'neighbors are disappointed by your absence. community spirit decreases.', coins: 0, happiness: -10 }
    ],
    weight: 1,
    minimumDay: 3
  },
  { 
    id: 'tree_planting', 
    title: 'community tree planting', 
    description: 'a local group is organizing a tree planting day. how would you like to participate?',
    options: [
      { text: 'donate trees (150 coins)', outcome: 'your donation beautified the neighborhood! everyone appreciates the new greenery.', coins: -150, happiness: 20 },
      { text: 'volunteer time only', outcome: 'your help was valuable! the day was a success.', coins: 0, happiness: 10 },
      { text: 'not interested', outcome: 'the event happened without you. some neighbors question your commitment.', coins: 0, happiness: -5 }
    ],
    weight: 1,
    minimumDay: 6
  },
  { 
    id: 'power_outage', 
    title: 'neighborhood power outage', 
    description: 'a storm caused a power outage! how will you respond?',
    options: [
      { text: 'share your generator', outcome: 'neighbors are grateful for your help during the crisis. community bonds strengthen!', coins: 0, happiness: 25 },
      { text: 'check on elderly neighbors', outcome: 'your concern for vulnerable neighbors is appreciated. you made a difference!', coins: 0, happiness: 15 },
      { text: 'stay home and wait', outcome: 'while understandable, some neighbors needed help. community connection decreased.', coins: 0, happiness: -8 }
    ],
    weight: 1,
    minimumDay: 10
  },
  
  {
    id: 'food_truck_friday',
    title: 'food truck friday',
    description: 'a trendy food truck wants to park in the neighborhood on fridays. what do you think?',
    options: [
      { text: 'approve and promote it (50 coins)', outcome: 'the food truck is a hit! neighbors gather every friday, creating a mini community event.', coins: -50, happiness: 15 },
      { text: 'approve but don\'t promote', outcome: 'the food truck comes, but few people know about it. still, those who stop by enjoy it.', coins: 0, happiness: 5 },
      { text: 'deny permission', outcome: 'residents are disappointed they missed out on the trendy food. they see other neighborhoods posting about it on social media.', coins: 0, happiness: -10 }
    ],
    weight: 1,
    minimumDay: 5
  },
  {
    id: 'wifi_upgrade',
    title: 'neighborhood wifi upgrade',
    description: 'residents are complaining about slow internet. a new provider offers to install fiber optics throughout the neighborhood.',
    options: [
      { text: 'approve and subsidize (200 coins)', outcome: 'lightning-fast internet! remote workers and streamers are thrilled. #bestneighborhood trends locally.', coins: -200, happiness: 20 },
      { text: 'approve at resident expense', outcome: 'better internet arrives but some can\'t afford the upgrade, creating a digital divide in the neighborhood.', coins: 0, happiness: 5 },
      { text: 'stick with current provider', outcome: 'residents continue to suffer with buffering videos and dropped zoom calls. complaints increase.', coins: 0, happiness: -10 }
    ],
    weight: 1,
    minimumDay: 8
  },
  {
    id: 'noise_complaint',
    title: 'late night noise complaint',
    description: 'several neighbors have filed complaints about loud music coming from the new resident\'s house at 2 am on weekends.',
    options: [
      { text: 'organize a community discussion', outcome: 'everyone reached an understanding! weekends can be lively until midnight, then quiet hours begin. compromise achieved!', coins: 0, happiness: 10 },
      { text: 'issue a formal warning', outcome: 'the music stops but creates tension between new and old residents. the vibe is a bit awkward now.', coins: 0, happiness: -5 },
      { text: 'ignore the complaints', outcome: 'older residents are frustrated by the lack of action, while younger ones appreciate the lively atmosphere. mixed results.', coins: 0, happiness: 0 }
    ],
    weight: 1,
    minimumDay: 7
  },
  
  {
    id: 'viral_challenge',
    title: 'the neighborhood challenge',
    description: 'residents want to participate in the latest viral dance challenge to put your neighborhood on the map. it involves dancing in the streets with household items.',
    options: [
      { text: 'organize a massive group version', outcome: 'the video went viral! #neighborvillechallenge is trending and your neighborhood is now internet famous.', coins: 100, happiness: 25 },
      { text: 'allow but don\'t participate', outcome: 'some fun videos were made but nothing got serious traction. still, people had fun.', coins: 0, happiness: 10 },
      { text: 'ban it as too disruptive', outcome: 'neighboring communities all went viral while yours stayed offline. major fomo ensued.', coins: 0, happiness: -15 }
    ],
    weight: 0.7,
    minimumDay: 12
  },
  {
    id: 'meme_sign',
    title: 'meme street signs',
    description: 'the youth council proposes replacing some street signs with meme-inspired alternatives for one week. they promise it won\'t affect navigation.',
    options: [
      { text: 'absolutely yes', outcome: '"this way home, bestie" and "honk if you\'re ✨chronically online✨" signs brought joy to everyone. tourists came just to take pictures.', coins: 50, happiness: 20 },
      { text: 'allow one sign only', outcome: 'the "no thoughts just vibes" speed limit sign became a minor attraction. not bad.', coins: 10, happiness: 5 },
      { text: 'reject the proposal', outcome: 'the youth are posting about how the neighborhood "passed the vibe check but failed the vibe final exam". whatever that means.', coins: 0, happiness: -10 }
    ],
    weight: 0.6,
    minimumDay: 9
  },
  {
    id: 'plant_parent',
    title: 'extreme plant parenting',
    description: 'local residents have started treating their houseplants as actual children, throwing birthday parties for them and creating plant social media accounts.',
    options: [
      { text: 'sponsor a plant prom event', outcome: 'the plant prom drew nationwide attention! "it\'s giving chlorophyll realness" went viral and boosted local plant shops.', coins: -75, happiness: 20 },
      { text: 'politely acknowledge the trend', outcome: '"plants mcgee from house 23 is now officially a rizz master" - sure, whatever makes people happy.', coins: 0, happiness: 5 },
      { text: 'suggest therapy instead', outcome: '"our mayor is giving boomer energy fr fr" - the plant parents are offended and moving their plant activities underground.', coins: 0, happiness: -5 }
    ],
    weight: 0.5,
    minimumDay: 11
  },

  {
    id: 'sinkhole',
    title: 'sudden sinkhole!',
    description: 'a sinkhole has appeared in the middle of the neighborhood! several buildings are at risk.',
    options: [
      { text: 'immediate emergency response (300 coins)', outcome: 'quick action saved all buildings! the repair was expensive but prevented worse damage.', coins: -300, happiness: -5 },
      { text: 'evacuate and assess (100 coins)', outcome: 'evacuation was successful, but one building was lost to the sinkhole before repairs could begin.', coins: -100, happiness: -20 },
      { text: 'hope it resolves itself', outcome: 'the sinkhole expanded dramatically! multiple buildings were damaged and residents are furious at the negligence.', coins: -500, happiness: -40 }
    ],
    weight: 0.3,
    minimumDay: 15
  },
  {
    id: 'festival_disaster',
    title: 'festival mishap',
    description: 'the annual neighborhood festival was going great until the food poisoning reports started coming in. the local news wants a statement.',
    options: [
      { text: 'accept responsibility & compensate (250 coins)', outcome: 'your transparency and generosity was appreciated. the incident blew over quickly.', coins: -250, happiness: -5 },
      { text: 'blame the food vendors', outcome: 'vendors are furious and refusing to return next year. residents are divided on who to believe.', coins: 0, happiness: -15 },
      { text: 'no comment', outcome: 'your silence was interpreted as guilt. trust in neighborhood leadership has plummeted.', coins: 0, happiness: -25 }
    ],
    weight: 0.4,
    minimumDay: 20
  },
  
  {
    id: 'investor_interest',
    title: 'property investor interest',
    description: 'a major real estate investor wants to buy several plots in your neighborhood for development. they\'re offering above market rates.',
    options: [
      { text: 'approve with community benefits', outcome: 'the deal included a new community center! property values increased and the neighborhood flourished.', coins: 500, happiness: 15 },
      { text: 'approve with no conditions', outcome: 'development proceeded but longtime residents feel pushed out by rising costs. mixed outcome.', coins: 300, happiness: -10 },
      { text: 'reject the offer', outcome: 'preserving neighborhood character was appreciated by current residents, but growth opportunities were missed.', coins: 0, happiness: 5 }
    ],
    weight: 0.7,
    minimumDay: 18
  },
  {
    id: 'influencer_moved_in',
    title: 'influencer neighbor',
    description: 'a social media star with millions of followers just moved into the neighborhood and wants to collaborate on content featuring local spots.',
    options: [
      { text: 'enthusiastic collaboration', outcome: 'local businesses are thriving with the influx of visitors! "the unofficial neighborville tour" is a hit online.', coins: 200, happiness: 20 },
      { text: 'selective limited features', outcome: 'controlled exposure brought some attention without overwhelming local spots. balanced approach worked well.', coins: 100, happiness: 10 },
      { text: 'politely decline', outcome: 'the influencer posted about the "exclusive vibe" anyway, leading to influencer tourists wandering around uninvited.', coins: -50, happiness: -5 }
    ],
    weight: 0.6,
    minimumDay: 14
  },
  
  {
    id: 'escaped_parrots',
    title: 'parrots on the loose',
    description: 'someone\'s exotic pet parrots escaped and are breeding in the neighborhood. they\'re beautiful but noisy and are starting to form flocks.',
    options: [
      { text: 'embrace as neighborhood mascots', outcome: '"the parrot people" becomes your neighborhood\'s unique identity! tourism increases despite occasional poop incidents.', coins: 100, happiness: 15 },
      { text: 'humane capture and rehoming', outcome: 'most parrots were safely relocated, though some residents miss the colorful visitors.', coins: -75, happiness: 5 },
      { text: 'ignore the situation', outcome: 'parrot population exploded! they\'re now waking everyone at dawn and destroying gardens. residents are sleep-deprived and irritable.', coins: 0, happiness: -20 }
    ],
    weight: 0.5,
    minimumDay: 16
  },
  {
    id: 'mysterious_packages',
    title: 'mysterious packages',
    description: 'everyone in the neighborhood is receiving unmarked packages containing random but oddly specific gifts that match their interests. no one knows who\'s sending them.',
    options: [
      { text: 'investigate thoroughly', outcome: 'turns out it was an elaborate marketing campaign for a new local business! you negotiated free products for all residents.', coins: 50, happiness: 15 },
      { text: 'post about it online', outcome: 'the mystery went viral! packages still arrive occasionally, maintaining an amusing neighborhood quirk.', coins: 25, happiness: 10 },
      { text: 'warn residents to be cautious', outcome: 'packages were harmless but your warning created unnecessary fear. the secret gift-giver stopped, disappointed.', coins: 0, happiness: -5 }
    ],
    weight: 0.4,
    minimumDay: 13
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