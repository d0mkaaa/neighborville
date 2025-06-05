export interface Resource {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'raw' | 'processed' | 'refined' | 'component' | 'luxury';
  baseValue: number;
  storageSpace: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'production' | 'processing' | 'crafting' | 'construction';
  inputs: { resourceId: string; quantity: number }[];
  outputs: { resourceId: string; quantity: number }[];
  productionTime: number;
  xpReward: number;
  unlockLevel: number;
  requiredBuilding: string;
}

export interface ProductionQueue {
  id: string;
  recipeId: string;
  startTime: number;
  completionTime: number;
  buildingIndex: number;
  status: 'queued' | 'active' | 'completed' | 'paused';
}

export const RESOURCES: Resource[] = [
  {
    id: 'wood',
    name: 'Wood',
    description: 'Basic building material harvested from trees',
    icon: '🪵',
    rarity: 'common',
    category: 'raw',
    baseValue: 5,
    storageSpace: 1
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'Durable material for construction',
    icon: '🪨',
    rarity: 'common',
    category: 'raw',
    baseValue: 8,
    storageSpace: 2
  },
  {
    id: 'clay',
    name: 'Clay',
    description: 'Moldable earth material for ceramics',
    icon: '🏺',
    rarity: 'common',
    category: 'raw',
    baseValue: 3,
    storageSpace: 1
  },
  {
    id: 'iron_ore',
    name: 'Iron Ore',
    description: 'Raw metal ore for smelting',
    icon: '⛏️',
    rarity: 'uncommon',
    category: 'raw',
    baseValue: 15,
    storageSpace: 2
  },
  {
    id: 'coal',
    name: 'Coal',
    description: 'Fuel for industrial processes',
    icon: '⚫',
    rarity: 'uncommon',
    category: 'raw',
    baseValue: 12,
    storageSpace: 1
  },
  {
    id: 'cotton',
    name: 'Cotton',
    description: 'Soft fiber for textiles',
    icon: '☁️',
    rarity: 'common',
    category: 'raw',
    baseValue: 6,
    storageSpace: 1
  },
  {
    id: 'oil',
    name: 'Oil',
    description: 'Black gold for advanced manufacturing',
    icon: '🛢️',
    rarity: 'rare',
    category: 'raw',
    baseValue: 25,
    storageSpace: 3  },

  {
    id: 'lumber',
    name: 'Lumber',
    description: 'Processed wood ready for construction',
    icon: '📏',
    rarity: 'common',
    category: 'processed',
    baseValue: 12,
    storageSpace: 2
  },
  {
    id: 'bricks',
    name: 'Bricks',
    description: 'Fired clay blocks for building',
    icon: '🧱',
    rarity: 'common',
    category: 'processed',
    baseValue: 10,
    storageSpace: 2
  },
  {
    id: 'iron_bars',
    name: 'Iron Bars',
    description: 'Smelted iron ready for forging',
    icon: '🔩',
    rarity: 'uncommon',
    category: 'processed',
    baseValue: 30,
    storageSpace: 2
  },
  {
    id: 'steel',
    name: 'Steel',
    description: 'Strong metal alloy for construction',
    icon: '⚙️',
    rarity: 'rare',
    category: 'processed',
    baseValue: 50,
    storageSpace: 3
  },
  {
    id: 'fabric',
    name: 'Fabric',
    description: 'Woven cotton for clothing and furnishing',
    icon: '🧵',
    rarity: 'common',
    category: 'processed',
    baseValue: 15,
    storageSpace: 1
  },
  {
    id: 'plastic',
    name: 'Plastic',
    description: 'Versatile synthetic material',
    icon: '🔳',
    rarity: 'uncommon',
    category: 'processed',
    baseValue: 20,
    storageSpace: 1
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Transparent material made from sand',
    icon: '🪟',
    rarity: 'uncommon',
    category: 'processed',
    baseValue: 18,
    storageSpace: 2  },

  {
    id: 'nails',
    name: 'Nails',
    description: 'Small metal fasteners',
    icon: '📎',
    rarity: 'common',
    category: 'component',
    baseValue: 8,
    storageSpace: 1
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Basic hand tools for construction',
    icon: '🔨',
    rarity: 'uncommon',
    category: 'component',
    baseValue: 35,
    storageSpace: 2
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Advanced electronic components',
    icon: '💻',
    rarity: 'rare',
    category: 'component',
    baseValue: 75,
    storageSpace: 1
  },
  {
    id: 'machinery',
    name: 'Machinery',
    description: 'Complex mechanical equipment',
    icon: '⚙️',
    rarity: 'epic',
    category: 'component',
    baseValue: 150,
    storageSpace: 4  },

  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Comfortable home furnishings',
    icon: '🪑',
    rarity: 'uncommon',
    category: 'luxury',
    baseValue: 60,
    storageSpace: 3
  },
  {
    id: 'art',
    name: 'Art',
    description: 'Beautiful decorative pieces',
    icon: '🎨',
    rarity: 'rare',
    category: 'luxury',
    baseValue: 100,
    storageSpace: 2
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Precious ornamental items',
    icon: '💎',
    rarity: 'epic',
    category: 'luxury',
    baseValue: 200,
    storageSpace: 1
  }
];

export const RECIPES: Recipe[] = [
  {
    id: 'wood_to_lumber',
    name: 'Process Lumber',
    description: 'Convert raw wood into construction-ready lumber',
    icon: '📏',
    category: 'processing',
    inputs: [{ resourceId: 'wood', quantity: 2 }],
    outputs: [{ resourceId: 'lumber', quantity: 1 }],
    productionTime: 5,
    xpReward: 2,
    unlockLevel: 1,
    requiredBuilding: 'sawmill'
  },
  {
    id: 'clay_to_bricks',
    name: 'Fire Bricks',
    description: 'Turn clay into sturdy building bricks',
    icon: '🧱',
    category: 'processing',
    inputs: [{ resourceId: 'clay', quantity: 3 }, { resourceId: 'coal', quantity: 1 }],
    outputs: [{ resourceId: 'bricks', quantity: 2 }],
    productionTime: 8,
    xpReward: 3,
    unlockLevel: 2,
    requiredBuilding: 'kiln'
  },
  {
    id: 'smelt_iron',
    name: 'Smelt Iron',
    description: 'Smelt iron ore into usable iron bars',
    icon: '🔩',
    category: 'processing',
    inputs: [{ resourceId: 'iron_ore', quantity: 2 }, { resourceId: 'coal', quantity: 2 }],
    outputs: [{ resourceId: 'iron_bars', quantity: 1 }],
    productionTime: 12,
    xpReward: 5,
    unlockLevel: 3,
    requiredBuilding: 'smelter'
  },
  {
    id: 'make_steel',
    name: 'Create Steel',
    description: 'Forge iron bars into strong steel',
    icon: '⚙️',
    category: 'processing',
    inputs: [{ resourceId: 'iron_bars', quantity: 2 }, { resourceId: 'coal', quantity: 1 }],
    outputs: [{ resourceId: 'steel', quantity: 1 }],
    productionTime: 15,
    xpReward: 8,
    unlockLevel: 5,
    requiredBuilding: 'steel_mill'
  },
  {
    id: 'weave_fabric',
    name: 'Weave Fabric',
    description: 'Turn cotton into useful fabric',
    icon: '🧵',
    category: 'processing',
    inputs: [{ resourceId: 'cotton', quantity: 3 }],
    outputs: [{ resourceId: 'fabric', quantity: 2 }],
    productionTime: 6,
    xpReward: 3,
    unlockLevel: 2,
    requiredBuilding: 'textile_mill'  },

  {
    id: 'craft_nails',
    name: 'Craft Nails',
    description: 'Forge iron bars into useful nails',
    icon: '📎',
    category: 'crafting',
    inputs: [{ resourceId: 'iron_bars', quantity: 1 }],
    outputs: [{ resourceId: 'nails', quantity: 4 }],
    productionTime: 4,
    xpReward: 2,
    unlockLevel: 3,
    requiredBuilding: 'blacksmith'
  },
  {
    id: 'craft_tools',
    name: 'Craft Tools',
    description: 'Create useful tools from steel and wood',
    icon: '🔨',
    category: 'crafting',
    inputs: [{ resourceId: 'steel', quantity: 1 }, { resourceId: 'lumber', quantity: 1 }],
    outputs: [{ resourceId: 'tools', quantity: 1 }],
    productionTime: 10,
    xpReward: 6,
    unlockLevel: 6,
    requiredBuilding: 'blacksmith'
  },
  {
    id: 'craft_furniture',
    name: 'Craft Furniture',
    description: 'Make comfortable furniture from lumber and fabric',
    icon: '🪑',
    category: 'crafting',
    inputs: [{ resourceId: 'lumber', quantity: 3 }, { resourceId: 'fabric', quantity: 1 }, { resourceId: 'nails', quantity: 2 }],
    outputs: [{ resourceId: 'furniture', quantity: 1 }],
    productionTime: 20,
    xpReward: 10,
    unlockLevel: 7,
    requiredBuilding: 'workshop'  },

  {
    id: 'make_electronics',
    name: 'Manufacture Electronics',
    description: 'Create advanced electronic components',
    icon: '💻',
    category: 'production',
    inputs: [{ resourceId: 'steel', quantity: 1 }, { resourceId: 'plastic', quantity: 2 }],
    outputs: [{ resourceId: 'electronics', quantity: 1 }],
    productionTime: 25,
    xpReward: 12,
    unlockLevel: 10,
    requiredBuilding: 'electronics_factory'
  },
  {
    id: 'assemble_machinery',
    name: 'Assemble Machinery',
    description: 'Build complex mechanical equipment',
    icon: '⚙️',
    category: 'production',
    inputs: [{ resourceId: 'steel', quantity: 3 }, { resourceId: 'electronics', quantity: 1 }, { resourceId: 'tools', quantity: 1 }],
    outputs: [{ resourceId: 'machinery', quantity: 1 }],
    productionTime: 45,
    xpReward: 20,
    unlockLevel: 15,
    requiredBuilding: 'machine_shop'  },

  {
    id: 'create_art',
    name: 'Create Art',
    description: 'Craft beautiful artistic pieces',
    icon: '🎨',
    category: 'crafting',
    inputs: [{ resourceId: 'lumber', quantity: 1 }, { resourceId: 'fabric', quantity: 2 }],
    outputs: [{ resourceId: 'art', quantity: 1 }],
    productionTime: 30,
    xpReward: 15,
    unlockLevel: 8,
    requiredBuilding: 'art_studio'
  },
  {
    id: 'craft_jewelry',
    name: 'Craft Jewelry',
    description: 'Create precious jewelry items',
    icon: '💎',
    category: 'crafting',
    inputs: [{ resourceId: 'steel', quantity: 1 }, { resourceId: 'glass', quantity: 2 }],
    outputs: [{ resourceId: 'jewelry', quantity: 1 }],
    productionTime: 35,
    xpReward: 18,
    unlockLevel: 12,
    requiredBuilding: 'jewelry_shop'
  }
];

export function getResourceById(id: string): Resource | undefined {
  return RESOURCES.find(resource => resource.id === id);
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(recipe => recipe.id === id);
}

export function getRecipesByBuilding(buildingId: string): Recipe[] {
  return RECIPES.filter(recipe => recipe.requiredBuilding === buildingId);
}

export function getRecipesByLevel(level: number): Recipe[] {
  return RECIPES.filter(recipe => recipe.unlockLevel <= level);
}

export function calculateProductionCost(recipe: Recipe, resourcePrices: Map<string, number>): number {
  return recipe.inputs.reduce((total, input) => {
    const price = resourcePrices.get(input.resourceId) || getResourceById(input.resourceId)?.baseValue || 0;
    return total + (price * input.quantity);
  }, 0);
}

export function calculateProductionValue(recipe: Recipe, resourcePrices: Map<string, number>): number {
  return recipe.outputs.reduce((total, output) => {
    const price = resourcePrices.get(output.resourceId) || getResourceById(output.resourceId)?.baseValue || 0;
    return total + (price * output.quantity);
  }, 0);
}

export function createDefaultPlayerResources(): Map<string, number> {
  const defaultResources = new Map<string, number>();
  
  defaultResources.set('wood', 10);
  defaultResources.set('stone', 10);
  defaultResources.set('iron_ore', 5);
  
  return defaultResources;
}
