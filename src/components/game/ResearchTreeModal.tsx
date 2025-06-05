import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Beaker, Lock, CheckCircle, ArrowRight, Zap, Leaf, Users, TrendingUp } from 'lucide-react';
import { RESEARCH_TREE } from '../../data/gameEvents';
import type { ResearchNode } from '../../data/gameEvents';

interface ResearchTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  currentDay: number;
  completedResearch: string[];
  onStartResearch: (nodeId: string, cost: number) => void;
  activeResearch: { nodeId: string; startDay: number; duration: number } | null;
}

export default function ResearchTreeModal({
  isOpen,
  onClose,
  coins,
  currentDay,
  completedResearch,
  onStartResearch,
  activeResearch
}: ResearchTreeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<ResearchNode | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: '🔬' },
    { id: 'technology', name: 'Technology', icon: '⚡' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'economic', name: 'Economic', icon: '📈' }
  ];

  const filteredNodes = RESEARCH_TREE.filter(node => 
    selectedCategory === 'all' || node.category === selectedCategory
  );

  const isNodeAvailable = (node: ResearchNode): boolean => {
    return node.prerequisites.every(prereq => completedResearch.includes(prereq));
  };

  const isNodeCompleted = (node: ResearchNode): boolean => {
    return completedResearch.includes(node.id);
  };

  const isNodeInProgress = (node: ResearchNode): boolean => {
    return activeResearch?.nodeId === node.id;
  };

  const getNodeStatus = (node: ResearchNode) => {
    if (isNodeCompleted(node)) return 'completed';
    if (isNodeInProgress(node)) return 'in-progress';
    if (isNodeAvailable(node)) return 'available';
    return 'locked';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technology':
        return <Zap size={16} className="text-blue-500" />;
      case 'environment':
        return <Leaf size={16} className="text-emerald-500" />;
      case 'social':
        return <Users size={16} className="text-purple-500" />;
      case 'economic':
        return <TrendingUp size={16} className="text-amber-500" />;
      default:
        return <Beaker size={16} className="text-gray-500" />;
    }
  };

  const getResearchProgress = (): number => {
    if (!activeResearch) return 0;
    const elapsed = currentDay - activeResearch.startDay;
    return Math.min(100, (elapsed / activeResearch.duration) * 100);
  };

  const handleStartResearch = (node: ResearchNode) => {
    if (coins >= node.cost && isNodeAvailable(node) && !activeResearch) {
      onStartResearch(node.id, node.cost);
      setSelectedNode(null);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Beaker size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold">Research & Development</h2>
                <p className="text-blue-100 text-sm">
                  Advance your city with cutting-edge technology
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {activeResearch && (
            <div className="mt-4 bg-white/20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  Researching: {RESEARCH_TREE.find(n => n.id === activeResearch.nodeId)?.name}
                </span>
                <span className="text-sm">
                  {Math.round(getResearchProgress())}%
                </span>
              </div>
              <div className="w-full bg-blue-800 rounded-full h-2">
                <motion.div 
                  className="bg-white h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getResearchProgress()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-xs text-blue-100 mt-1">
                {activeResearch.duration - (currentDay - activeResearch.startDay)} days remaining
              </div>
            </div>
          )}
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          <div className="w-48 bg-gray-50 border-r p-4">
            <h3 className="font-bold text-gray-800 mb-4">Categories</h3>
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-1">Available Coins</div>
              <div className="text-lg font-bold text-blue-800">{coins}</div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredNodes.map(node => {
                const status = getNodeStatus(node);
                const isLocked = status === 'locked';
                const isCompleted = status === 'completed';
                const isInProgress = status === 'in-progress';
                const isAvailable = status === 'available';

                return (
                  <motion.div
                    key={node.id}
                    whileHover={!isLocked ? { scale: 1.02 } : {}}
                    className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
                      isCompleted ? 'border-emerald-500 bg-emerald-50' :
                      isInProgress ? 'border-blue-500 bg-blue-50' :
                      isAvailable ? 'border-gray-300 bg-white hover:border-blue-300' :
                      'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => !isLocked && setSelectedNode(node)}
                  >
                    <div className="absolute top-2 right-2">
                      {isCompleted && <CheckCircle size={20} className="text-emerald-500" />}
                      {isInProgress && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                      )}
                      {isLocked && <Lock size={20} className="text-gray-400" />}
                    </div>

                    <div className="mb-3">
                      {getCategoryIcon(node.category)}
                    </div>

                    <h3 className={`font-bold mb-2 ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                      {node.name}
                    </h3>
                    <p className={`text-sm mb-3 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {node.description}
                    </p>

                    <div className="flex justify-between items-center text-xs">
                      <div className={`flex items-center gap-1 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>💰 {node.cost}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>⏱️ {node.researchTime}d</span>
                      </div>
                    </div>

                    {node.prerequisites.length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="text-gray-500">Requires:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {node.prerequisites.map(prereq => {
                            const prereqNode = RESEARCH_TREE.find(n => n.id === prereq);
                            const isPrereqCompleted = completedResearch.includes(prereq);
                            return (
                              <span
                                key={prereq}
                                className={`px-2 py-1 rounded text-xs ${
                                  isPrereqCompleted 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                              >
                                {prereqNode?.name || prereq}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isInProgress && (
                      <div className="mt-3">
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                          <motion.div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${getResearchProgress()}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setSelectedNode(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center mb-4">
                  {getCategoryIcon(selectedNode.category)}
                  <h3 className="font-bold text-xl ml-2">{selectedNode.name}</h3>
                </div>

                <p className="text-gray-600 mb-4">{selectedNode.description}</p>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Research Effects:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedNode.effects.unlocksBuildings && (
                      <li>🏗️ Unlocks: {selectedNode.effects.unlocksBuildings.join(', ')}</li>
                    )}
                    {selectedNode.effects.improvesEfficiency && (
                      <li>⚡ Efficiency: +{selectedNode.effects.improvesEfficiency.map(e => `${e.bonus}% ${e.buildingType}`).join(', ')}</li>
                    )}
                    {selectedNode.effects.reducesDisasterRisk && (
                      <li>🛡️ Disaster Risk: -{selectedNode.effects.reducesDisasterRisk}%</li>
                    )}
                    {selectedNode.effects.increasesIncome && (
                      <li>💰 Income: +{selectedNode.effects.increasesIncome}%</li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    Cost: <span className="font-medium">{selectedNode.cost} coins</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: <span className="font-medium">{selectedNode.researchTime} days</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStartResearch(selectedNode)}
                    disabled={
                      coins < selectedNode.cost || 
                      !isNodeAvailable(selectedNode) || 
                      !!activeResearch ||
                      isNodeCompleted(selectedNode)
                    }
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Beaker size={16} />
                    Start Research
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 