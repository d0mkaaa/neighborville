import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";
import { buildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { possibleEvents } from "../../data/events";
import type { 
  Building, GameEvent, Neighbor, NotificationType, ScheduledEvent 
} from "../../types/game";
import BuildingOption from "./BuildingOption";
import GameGrid from "./GameGrid";
import NeighborCard from "./NeighborCard";
import EventModal from "./EventModal";

export default function NeighborVille() {
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(1000);
  const [happiness, setHappiness] = useState(70);
  const [day, setDay] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [showNeighborInfo, setShowNeighborInfo] = useState<Neighbor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  
  const [grid, setGrid] = useState<(Building | null)[]>(Array(36).fill(null));
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (gameStarted) {
      const shuffled = [...neighborProfiles].sort(() => 0.5 - Math.random());
      setNeighbors(shuffled.slice(0, 3));
      
      setEvents([
        { eventId: 'block_party', dayTrigger: 3 },
        { eventId: 'tree_planting', dayTrigger: 6 },
        { eventId: 'power_outage', dayTrigger: 10 }
      ]);
      
      showNotification('Welcome to your new neighborhood! Start building.', 'info');
    }
  }, [gameStarted]);
  
  useEffect(() => {
    if (gameStarted && day > 1) {
      const todayEvent = events.find(e => e.dayTrigger === day);
      if (todayEvent) {
        const eventDetails = possibleEvents.find(e => e.id === todayEvent.eventId);
        if (eventDetails) {
          setCurrentEvent(eventDetails);
          setModalOpen(true);
        }
      }
    }
  }, [day, events, gameStarted]);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  const handleStartGame = () => {
    if (playerName.trim() === "") {
      showNotification('Please enter a name', 'error');
      return;
    }
    
    setGameStarted(true);
    showNotification('Welcome to NeighborVille!', 'success');
  };
  
  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedTile(null);
    showNotification(`Selected: ${building.name}`, 'info');
  };
  
  const handleTileClick = (index: number) => {
    if (selectedBuilding && grid[index] === null) {
      if (coins >= selectedBuilding.cost) {
        const newGrid = [...grid];
        newGrid[index] = selectedBuilding;
        
        setGrid(newGrid);
        setCoins(coins - selectedBuilding.cost);
        setHappiness(Math.min(100, happiness + selectedBuilding.happiness));
        
        showNotification(`Built a ${selectedBuilding.name}!`, 'success');
        setSelectedBuilding(null);
      } else {
        showNotification('Not enough coins!', 'error');
      }
    } 
    else if (!selectedBuilding && grid[index] !== null) {
      setSelectedTile(index);
    } 
    else {
      setSelectedTile(null);
    }
  };
  
  const handleDeleteBuilding = (index: number) => {
    const buildingToDelete = grid[index];
    if (!buildingToDelete) return;
    
    const newGrid = [...grid];
    newGrid[index] = null;
    
    setGrid(newGrid);
    setCoins(coins + Math.floor(buildingToDelete.cost * 0.5));
    setHappiness(Math.max(0, happiness - Math.floor(buildingToDelete.happiness * 0.5)));
    
    showNotification(`Demolished a ${buildingToDelete.name}`, 'info');
    setSelectedTile(null);
  };
  
  const handleEndDay = () => {
    const income = grid.reduce((total, building) => {
      if (building) {
        return total + building.income;
      }
      return total;
    }, 0);
    
    setCoins(coins + income);
    setDay(day + 1);
    showNotification(`Day ${day} complete! Earned ${income} coins.`, 'success');
  };
  
  const handleEventOption = (option: { coins: number, happiness: number, outcome: string }) => {
    setCoins(coins + option.coins);
    setHappiness(Math.max(0, Math.min(100, happiness + option.happiness)));
    showNotification(option.outcome, option.happiness > 0 ? 'success' : 'warning');
    setModalOpen(false);
    setCurrentEvent(null);
  };

  const handleNeighborClick = (neighbor: Neighbor) => {
    setShowNeighborInfo(neighbor);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <div className="text-4xl font-bold mb-4 font-game">NeighborVille</div>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="mt-4 text-sm font-game">Building your neighborhood...</div>
      </div>
    );
  }
  
  if (!gameStarted) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white bg-opacity-10 animate-pulse"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="text-6xl font-bold text-white mb-6 animate-in transform translate-y-0 opacity-100 font-game" style={{ transitionDelay: '0.3s' }}>
            NeighborVille
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 w-full max-w-md animate-in opacity-100 scale-100" style={{ transitionDelay: '0.5s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 font-game">Build Your Dream Neighborhood</h2>
            
            <div className="mb-4">
              <label className="block text-white text-sm mb-2 font-game">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 outline-none focus:ring-2 focus:ring-white font-game"
                placeholder="Enter your name"
              />
            </div>
            
            <button
              onClick={handleStartGame}
              className="w-full bg-white text-purple-600 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors font-game"
            >
              Start Building
            </button>
            
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full mt-3 bg-transparent border border-white text-white py-2 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors font-game"
            >
              How to Play
            </button>
          </div>
          
          {showTutorial && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 max-w-lg w-full animate-in opacity-100 scale-100 shadow-xl">
                <h2 className="text-2xl font-bold text-purple-600 mb-4 font-game">How to Play NeighborVille</h2>
                <div className="space-y-3 text-gray-700 font-game">
                  <p>• Build and manage your neighborhood by placing buildings on the grid.</p>
                  <p>• Each building costs coins but increases neighborhood happiness.</p>
                  <p>• End each day to collect income from your buildings.</p>
                  <p>• Interact with neighbors and respond to community events.</p>
                  <p>• Balance your budget while creating the happiest neighborhood!</p>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="mt-6 bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors font-game"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen grass-bg">
      {notification && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 py-2 px-4 rounded-lg shadow-lg animate-in opacity-100 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          } text-white font-game`}
        >
          {notification.message}
        </div>
      )}
      
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-game">NeighborVille</h1>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="mr-2">💰</div>
              <span className="font-semibold font-game">{coins} coins</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">😊</div>
              <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${happiness}%` }}
                ></div>
              </div>
              <span className="ml-2 font-semibold font-game">{happiness}%</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">📅</div>
              <span className="font-semibold font-game">Day {day}</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-semibold font-game text-indigo-800">{playerName}</h2>
                <div className="text-sm text-gray-500 font-game">Neighborhood Mayor</div>
              </div>
            </div>
            
            <button
              onClick={handleEndDay}
              className="button-primary w-full font-game"
            >
              End Day
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3 font-game text-indigo-800">Available Buildings</h2>
            <div className="grid grid-cols-2 gap-2">
              {buildings.map((building) => (
                <BuildingOption 
                  key={building.id}
                  building={building}
                  isSelected={selectedBuilding?.id === building.id}
                  onSelect={handleBuildingSelect}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3 font-game text-indigo-800">Your Neighbors</h2>
            <div className="space-y-2">
              {neighbors.map((neighbor) => (
                <NeighborCard 
                  key={neighbor.id}
                  neighbor={neighbor}
                  onClick={handleNeighborClick}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <GameGrid 
            grid={grid}
            selectedBuilding={selectedBuilding}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            onDeleteBuilding={handleDeleteBuilding}
          />
        </div>
      </main>
      
      {showNeighborInfo && (
        <div
          className="modal-backdrop"
          onClick={() => setShowNeighborInfo(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">{showNeighborInfo.avatar}</div>
              <div>
                <h2 className="text-xl font-bold font-game text-indigo-800">{showNeighborInfo.name}</h2>
                <div className="text-gray-500 font-game">{showNeighborInfo.trait}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="font-medium mb-2 font-game text-indigo-700">About</div>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-game">
                <p>{showNeighborInfo.name} has been living in the neighborhood for 3 years. They're known for being {showNeighborInfo.trait.toLowerCase()} and active in community events.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-700 mb-1 font-game">Likes</div>
                <div className="text-sm font-game">{showNeighborInfo.likes}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-red-700 mb-1 font-game">Dislikes</div>
                <div className="text-sm font-game">{showNeighborInfo.dislikes}</div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowNeighborInfo(null)}
                className="button-secondary font-game"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {modalOpen && currentEvent && (
        <EventModal
          event={currentEvent}
          onOptionSelect={handleEventOption}
        />
      )}
    </div>
  );
}