import { AnimatePresence, motion } from "framer-motion";
import SaveManager from './SaveManager';
import HappinessAnalytics from './HappinessAnalytics';
import SettingsModal from './SettingsModal';
import PlayerStatsModal from './PlayerStatsModal';
import NeighborListModal from './NeighborListModal';
import AchievementsModal from './AchievementsModal';
import CalendarView from './CalendarView';
import CoinHistory from './CoinHistory';
import TutorialGuide from './TutorialGuide';
import EventModal from './EventModal';
import NeighborUnlockModal from './NeighborUnlockModal';
import AchievementUnlockModal from './AchievementUnlockModal';
import BuildingInfoModal from './BuildingInfoModal';
import Marketplace from './Marketplace';
import SpecialEvents from './SpecialEvents';
import type { 
  GameProgress, 
  Achievement, 
  Neighbor, 
  Building, 
  GameEvent, 
  RecentEvent, 
  CoinHistoryEntry,
  WeatherType
} from '../../types/game';

type DayRecord = {
  day: number;
  coins: number;
  happiness: number;
  residents: number;
  buildings: number;
  income: number;
  expenses: number;
  events: { name: string; type: 'good' | 'bad' | 'neutral' }[];
};

type GameModalsProps = {
  showSaveManager: boolean;
  showHappinessAnalytics: boolean;
  showSettings: boolean;
  showTutorial: boolean;
  showNeighborList: boolean;
  showAchievements: boolean;
  showCalendar: boolean;
  showCoinHistory: boolean;
  showPlayerStats: boolean;
  showMarketplace: boolean;
  showSpecialEvents: boolean;
  tutorialStep: number;
  musicEnabled: boolean;
  audioRef: React.RefObject<HTMLIFrameElement | HTMLAudioElement | null>;
  gameData: GameProgress;
  achievements: Achievement[];
  neighbors: Neighbor[];
  grid: (Building | null)[];
  coins: number;
  happiness: number;
  day: number;
  level: number;
  buildings: Building[];
  recentEvents: RecentEvent[];
  weather: WeatherType;
  currentEvent: GameEvent | null;
  showNeighborUnlock: Neighbor | null;
  showAchievementUnlock: Achievement | null;
  showBuildingInfo: {building: Building, index: number} | null;
  dayRecords: DayRecord[];
  coinHistory: CoinHistoryEntry[];
  onCloseSaveManager: () => void;
  onSave: (name?: string) => void;
  onCloseHappinessAnalytics: () => void;
  onCloseSettings: () => void;
  onCloseTutorial: () => void;
  onNextTutorialStep: () => void;
  onCloseNeighborList: () => void;
  onCloseAchievements: () => void;
  onCloseCalendar: () => void;
  onCloseCoinHistory: () => void;
  onClosePlayerStats: () => void;
  onCloseMarketplace: () => void;
  onCloseSpecialEvents: () => void;
  onToggleMusic: () => void;
  onShowTutorial: () => void;
  onEventOptionSelect: (option: any) => void;
  onCloseNeighborUnlock: () => void;
  onCloseAchievementUnlock: () => void;
  onCloseBuildingInfo: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: (gridIndex: number, amount: number) => void;
  onMoveBuilding: (fromIndex: number) => void;
  onUpgradeBuilding: (gridIndex: number) => void;
  onDemolishBuilding: (gridIndex: number) => void;
  onPurchaseMarketItem: (item: any) => void;
  onSellMarketItem: (itemId: string, price: number) => void;
  onUpdateGameState: (updates: any) => void;
  onParticipateSpecialEvent: (eventId: string, activityId: string) => void;
  onClaimSpecialEventReward: (eventId: string) => void;
};

export default function GameModals({
  showSaveManager,
  showHappinessAnalytics,
  showSettings,
  showTutorial,
  showNeighborList,
  showAchievements,
  showCalendar,
  showCoinHistory,
  showPlayerStats,
  showMarketplace,
  showSpecialEvents,
  tutorialStep,
  musicEnabled,
  audioRef,
  gameData,
  achievements,
  neighbors,
  grid,
  coins,
  happiness,
  day,
  level,
  buildings,
  recentEvents,
  weather,
  currentEvent,
  showNeighborUnlock,
  showAchievementUnlock,
  showBuildingInfo,
  dayRecords,
  coinHistory,
  onCloseSaveManager,
  onSave,
  onCloseHappinessAnalytics,
  onCloseSettings,
  onCloseTutorial,
  onNextTutorialStep,
  onCloseNeighborList,
  onCloseAchievements,
  onCloseCalendar,
  onCloseCoinHistory,
  onClosePlayerStats,
  onCloseMarketplace,
  onCloseSpecialEvents,
  onToggleMusic,
  onShowTutorial,
  onEventOptionSelect,
  onCloseNeighborUnlock,
  onCloseAchievementUnlock,
  onCloseBuildingInfo,
  onAssignResident,
  onRemoveResident,
  onCollectIncome,
  onMoveBuilding,
  onUpgradeBuilding,
  onDemolishBuilding,
  onPurchaseMarketItem,
  onSellMarketItem,
  onUpdateGameState,
  onParticipateSpecialEvent,
  onClaimSpecialEventReward
}: GameModalsProps) {
  return (
    <>
      <SaveManager 
        isOpen={showSaveManager}
        onClose={onCloseSaveManager}
        onSave={onSave}
        gameData={gameData}
      />

      <AnimatePresence>
        {showHappinessAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={onCloseHappinessAnalytics}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <HappinessAnalytics
                happiness={happiness}
                buildings={buildings}
                neighbors={neighbors}
                grid={grid}
                recentEvents={recentEvents}
                weather={weather}
              />
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={onCloseHappinessAnalytics}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings}
            onClose={onCloseSettings}
            musicEnabled={musicEnabled}
            onToggleMusic={onToggleMusic}
            audioRef={audioRef}
            onShowTutorial={() => {
              onCloseSettings();
              onShowTutorial();
            }}
            onShowStats={() => {
              onCloseSettings();
              onPlayerStatsModal();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlayerStats && (
          <PlayerStatsModal 
            gameData={gameData}
            achievements={achievements}
            neighbors={neighbors}
            grid={grid}
            onClose={onClosePlayerStats}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentEvent && (
          <EventModal 
            event={currentEvent}
            onOptionSelect={onEventOptionSelect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeighborUnlock && (
          <NeighborUnlockModal 
            neighbor={showNeighborUnlock}
            onClose={onCloseNeighborUnlock}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeighborList && (
          <NeighborListModal 
            neighbors={neighbors}
            onClose={onCloseNeighborList}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievements && (
          <AchievementsModal 
            achievements={achievements}
            onClose={onCloseAchievements}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievementUnlock && (
          <AchievementUnlockModal 
            achievement={showAchievementUnlock}
            onClose={onCloseAchievementUnlock}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuildingInfo && (
          <BuildingInfoModal 
            building={showBuildingInfo.building}
            gridIndex={showBuildingInfo.index}
            neighbors={neighbors}
            onClose={onCloseBuildingInfo}
            onAssignResident={onAssignResident}
            onRemoveResident={onRemoveResident}
            onCollectIncome={onCollectIncome}
            onMoveBuilding={onMoveBuilding}
            onUpgradeBuilding={onUpgradeBuilding}
            onDemolishBuilding={onDemolishBuilding}
            grid={grid}
            coins={coins}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCalendar && (
          <CalendarView 
            dayRecords={dayRecords}
            currentDay={day}
            onClose={onCloseCalendar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCoinHistory && (
          <CoinHistory 
            history={coinHistory}
            onClose={onCloseCoinHistory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <TutorialGuide 
            step={tutorialStep}
            onNextStep={onNextTutorialStep}
            onClose={onCloseTutorial}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMarketplace && (
          <Marketplace
            neighbors={neighbors}
            coins={coins}
            day={day}
            onClose={onCloseMarketplace}
            onPurchase={onPurchaseMarketItem}
            onSellItem={onSellMarketItem}
            grid={grid}
            onUpdateGameState={onUpdateGameState}
            playerLevel={level}
            gameProgress={gameData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpecialEvents && (
          <SpecialEvents
            gameData={gameData}
            neighbors={neighbors}
            grid={grid}
            onClose={onCloseSpecialEvents}
            onParticipate={onParticipateSpecialEvent}
            onClaimReward={onClaimSpecialEventReward}
            onUpdateGameState={onUpdateGameState}
          />
        )}
      </AnimatePresence>
    </>
  );
}