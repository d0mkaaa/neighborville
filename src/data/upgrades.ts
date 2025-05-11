import type { BuildingUpgrade } from "../types/game";

export const buildingUpgrades: Record<string, BuildingUpgrade[]> = {
  // resdential upgrades
  house: [
    {
      id: "insulation",
      name: "Energy Efficient Insulation",
      description: "Reduce energy costs by 15% and improve resident happiness",
      cost: 500,
      incomeBoost: 0,
      happinessBoost: 5,
      energyEfficiency: 0.15,
      level: 1,
      icon: "🌡️"
    },
    {
      id: "solar_panels",
      name: "Solar Panels",
      description: "Generate a small income and reduce energy costs by 25%",
      cost: 800,
      incomeBoost: 5,
      happinessBoost: 2,
      energyEfficiency: 0.25,
      level: 2,
      icon: "☀️"
    },
    {
      id: "smart_home",
      name: "Smart Home System",
      description: "Improve resident happiness and reduce energy costs by 10%",
      cost: 1200,
      incomeBoost: 0,
      happinessBoost: 10,
      energyEfficiency: 0.10,
      level: 3,
      icon: "🏠"
    }
  ],
  apartment: [
    {
      id: "lobby_renovation",
      name: "Lobby Renovation",
      description: "Increase happiness of all residents",
      cost: 600,
      incomeBoost: 0,
      happinessBoost: 7,
      level: 1,
      icon: "🛋️"
    },
    {
      id: "laundry_room",
      name: "Laundry Room",
      description: "Generate additional income and slightly increase resident happiness",
      cost: 900,
      incomeBoost: 10,
      happinessBoost: 3,
      level: 2,
      icon: "🧺"
    },
    {
      id: "rooftop_garden",
      name: "Rooftop Garden",
      description: "Significantly increase happiness and generate a small income",
      cost: 1400,
      incomeBoost: 5,
      happinessBoost: 12,
      level: 3,
      icon: "🌱"
    }
  ],
  
  // comercial upgrades
  cafe: [
    {
      id: "outdoor_seating",
      name: "Outdoor Seating",
      description: "Increase maximum capacity and income",
      cost: 400,
      incomeBoost: 15,
      happinessBoost: 2,
      level: 1,
      icon: "☕"
    },
    {
      id: "wifi_upgrade",
      name: "Free High-Speed WiFi",
      description: "Attract more customers and increase happiness",
      cost: 650,
      incomeBoost: 10,
      happinessBoost: 5,
      level: 2,
      icon: "📡"
    },
    {
      id: "gourmet_menu",
      name: "Gourmet Menu",
      description: "Significantly increase income and happiness",
      cost: 1100,
      incomeBoost: 25,
      happinessBoost: 8,
      level: 3,
      icon: "🍰"
    }
  ],
  shop: [
    {
      id: "storefront",
      name: "Storefront Renovation",
      description: "Attract more customers and increase income",
      cost: 350,
      incomeBoost: 12,
      happinessBoost: 3,
      level: 1,
      icon: "🏪"
    },
    {
      id: "inventory",
      name: "Expanded Inventory",
      description: "Increase income from sales",
      cost: 700,
      incomeBoost: 20,
      happinessBoost: 0,
      level: 2,
      icon: "📦"
    },
    {
      id: "online_shop",
      name: "Online Shop",
      description: "Generate income 24/7 with reduced energy consumption",
      cost: 1000,
      incomeBoost: 30,
      happinessBoost: 5,
      energyEfficiency: 0.10,
      level: 3,
      icon: "🖥️"
    }
  ],
  
  // utility upgrades
  power_plant: [
    {
      id: "efficiency",
      name: "Efficiency Upgrades",
      description: "Increase power output by 20%",
      cost: 800,
      incomeBoost: 0,
      happinessBoost: 0,
      level: 1,
      icon: "⚡"
    },
    {
      id: "green_tech",
      name: "Green Technology",
      description: "Reduce pollution and increase happiness",
      cost: 1200,
      incomeBoost: 0,
      happinessBoost: 8,
      level: 2,
      icon: "🌿"
    },
    {
      id: "power_grid",
      name: "Smart Power Grid",
      description: "Extend connection range to 4 tiles and increase output",
      cost: 2000,
      incomeBoost: 0,
      happinessBoost: 5,
      level: 3,
      icon: "🔌"
    }
  ],
  water_tower: [
    {
      id: "filters",
      name: "Advanced Filtration",
      description: "Improve water quality and resident happiness",
      cost: 600,
      incomeBoost: 0,
      happinessBoost: 5,
      level: 1,
      icon: "💧"
    },
    {
      id: "pipes",
      name: "New Pipe System",
      description: "Extend connection range to 4 tiles",
      cost: 1000,
      incomeBoost: 0,
      happinessBoost: 0,
      level: 2,
      icon: "🔧"
    },
    {
      id: "recycling",
      name: "Water Recycling",
      description: "Significantly increase water output and happiness",
      cost: 1600,
      incomeBoost: 0,
      happinessBoost: 10,
      level: 3,
      icon: "♻️"
    }
  ],
  
  // entertainment upgrades
  park: [
    {
      id: "playground",
      name: "Playground",
      description: "Increase happiness for nearby residents",
      cost: 300,
      incomeBoost: 0,
      happinessBoost: 10,
      level: 1,
      icon: "🛝"
    },
    {
      id: "events",
      name: "Community Events",
      description: "Host events that generate income and happiness",
      cost: 500,
      incomeBoost: 15,
      happinessBoost: 8,
      level: 2,
      icon: "🎪"
    },
    {
      id: "botanical",
      name: "Botanical Garden",
      description: "Transform into a premium attraction with entrance fees",
      cost: 1200,
      incomeBoost: 30,
      happinessBoost: 15,
      level: 3,
      icon: "🌺"
    }
  ],
  cinema: [
    {
      id: "seating",
      name: "Premium Seating",
      description: "Increase ticket income and visitor happiness",
      cost: 700,
      incomeBoost: 18,
      happinessBoost: 5,
      level: 1,
      icon: "🎬"
    },
    {
      id: "food_court",
      name: "Food Court",
      description: "Significantly increase income from concessions",
      cost: 1100,
      incomeBoost: 25,
      happinessBoost: 3,
      level: 2,
      icon: "🍿"
    },
    {
      id: "imax",
      name: "IMAX Upgrade",
      description: "Premium movie experience with major income and happiness boosts",
      cost: 2000,
      incomeBoost: 40,
      happinessBoost: 12,
      level: 3,
      icon: "🎞️"
    }
  ],
};

export const getAvailableUpgrades = (buildingId: string, currentLevel: number = 0): BuildingUpgrade[] => {
  const baseType = buildingId.split('_')[0];
  
  const allUpgrades = buildingUpgrades[baseType] || [];
  return allUpgrades.filter(upgrade => upgrade.level === currentLevel + 1);
};

export const calculateUpgradedStats = (
  building: any, 
  upgradeIds: string[]
): { 
  income: number, 
  happiness: number, 
  energyUsage: number 
} => {
  const baseType = building.id.split('_')[0];
  const allUpgrades = buildingUpgrades[baseType] || [];
  
  let incomeBoost = 0;
  let happinessBoost = 0;
  let energyEfficiency = 0;
  
  upgradeIds.forEach(upgradeId => {
    const upgrade = allUpgrades.find(u => u.id === upgradeId);
    if (upgrade) {
      incomeBoost += upgrade.incomeBoost;
      happinessBoost += upgrade.happinessBoost;
      energyEfficiency += upgrade.energyEfficiency || 0;
    }
  });
  
  const energyUsage = building.energyUsage || 0;
  const reducedEnergyUsage = energyEfficiency > 0 
    ? Math.max(0, energyUsage * (1 - energyEfficiency)) 
    : energyUsage;
  
  return {
    income: building.income + incomeBoost,
    happiness: building.happiness + happinessBoost,
    energyUsage: reducedEnergyUsage
  };
};
