import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Frown, Home, Zap, Droplets, ChevronUp, ChevronDown } from "lucide-react";
import type { Neighbor, Building } from "../../types/game";

type SocialPost = {
  id: string;
  neighborId: number;
  message: string;
  time: string;
  type: 'complaint' | 'praise' | 'observation' | 'concern';
  icon?: React.ReactNode;
  likes: number;
  timestamp: number;
};

type NeighborSocialFeedProps = {
  neighbors: Neighbor[];
  grid: (Building | null)[];
  onClose: () => void;
  currentDay: number;
  timeOfDay: string;
};

export default function NeighborSocialFeed({ neighbors, grid, onClose, currentDay, timeOfDay }: NeighborSocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    generateRandomPost();
    const interval = setInterval(generateRandomPost, 15000);
    return () => clearInterval(interval);
  }, [neighbors, grid, currentDay, timeOfDay]);

  const generateRandomPost = () => {
    const activeNeighbors = neighbors.filter(n => n.unlocked && n.hasHome);
    if (activeNeighbors.length === 0) return;

    const neighbor = activeNeighbors[Math.floor(Math.random() * activeNeighbors.length)];
    const happiness = neighbor.happiness || 70;
    
    const messages = {
      complaint: [
        "Still no power in my building! 😤 #poweroutage",
        "The water is still out... how am I supposed to shower? 💦",
        "My apartment is too crowded. Need more space! 🏠",
        "Where are all the places that are actually open at this hour? 🕐",
        "The energy bills are getting ridiculous... 💸",
        "Need more entertainment options around here! 🎮",
        "Too many people living in my building. It's chaos! 👥",
      ],
      praise: [
        "Loving the new park! Perfect for morning jogs 🏃‍♀️ #neighborhoodgoals",
        "The music venue is amazing! Great vibes tonight 🎵",
        "Finally got solar panels in our area! Go green! ☀️",
        "Coffee shop on the corner makes the best latte ☕️",
        "Power grid working perfectly now! Thank you mayor! ⚡️",
        "The library has become my favorite spot 📚",
        "Happy to have reliable water supply now! 💧",
      ],
      observation: [
        "Noticed a lot of new construction lately... 🏗️",
        "The neighborhood is really growing! 📈",
        "More people moving in every day it seems 👋",
        "Weather has been perfect for spending time outside ☀️",
        "Busy day at the local shops today 🛍️",
        "Lots of activity in the music district tonight 🎶",
        "The community garden is looking amazing! 🌱",
      ],
      concern: [
        "Is anyone else worried about the energy consumption? 🤔",
        "Housing prices are getting steep... 💰",
        "Traffic is becoming an issue 🚗",
        "We need better waste management solutions ♻️",
        "The bills keep piling up... hope this is sustainable 📄",
        "Anyone else feeling the housing crunch? 🏘️",
        "Quality of life concerns are rising... 📊",
      ]
    };

    let postType: 'complaint' | 'praise' | 'observation' | 'concern';
    let icon: React.ReactNode;
    
    if (happiness < 40) {
      postType = Math.random() < 0.7 ? 'complaint' : 'concern';
      icon = <Frown size={16} className="text-red-500" />;
    } else if (happiness > 70) {
      postType = Math.random() < 0.7 ? 'praise' : 'observation';
      icon = <Heart size={16} className="text-emerald-500" />;
    } else {
      const types: Array<'observation' | 'concern'> = ['observation', 'concern'];
      postType = types[Math.floor(Math.random() * types.length)];
      icon = postType === 'concern' ? <Frown size={16} className="text-yellow-500" /> : null;
    }

    const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
    if (house) {
      if (house.needsElectricity && !house.isConnectedToPower) {
        if (Math.random() < 0.3) {
          postType = 'complaint';
          icon = <Zap size={16} className="text-red-500" />;
          messages.complaint.push("Still no electricity! This is getting old... ⚡️");
        }
      }
      if (house.needsWater && !house.isConnectedToWater) {
        if (Math.random() < 0.3) {
          postType = 'complaint';
          icon = <Droplets size={16} className="text-red-500" />;
          messages.complaint.push("No water again! When will this be fixed? 💧");
        }
      }
    }

    const possibleMessages = messages[postType];
    const message = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];

    const newPost: SocialPost = {
      id: Date.now().toString(),
      neighborId: neighbor.id,
      message,
      time: formatTimeAgo(Date.now()),
      type: postType,
      icon,
      likes: Math.floor(Math.random() * 5) + 1,
      timestamp: Date.now()
    };

    setPosts(prev => [newPost, ...prev].slice(0, 10));
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getNeighborAvatar = (neighborId: number) => {
    const neighbor = neighbors.find(n => n.id === neighborId);
    return neighbor?.avatar || '👤';
  };

  const getNeighborName = (neighborId: number) => {
    const neighbor = neighbors.find(n => n.id === neighborId);
    return neighbor?.name || 'Anonymous';
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40"
      >
        <motion.button
          onClick={() => setIsExpanded(true)}
          whileHover={{ scale: 1.05 }}
          className="bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-white/20 flex items-center gap-2"
        >
          <div className="text-emerald-600 font-medium">💬</div>
          <ChevronUp size={16} className="text-gray-600" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 w-80 max-h-96 overflow-hidden">
        <div className="p-3 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-sm font-medium lowercase flex items-center">
            💬 neighborhood feed
          </h2>
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-80" style={{ scrollbarWidth: 'thin' }}>
          {posts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-2">
                <div className="text-xl">{getNeighborAvatar(post.neighborId)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {getNeighborName(post.neighborId)}
                    </span>
                    <span className="text-xs text-gray-500">{post.time}</span>
                  </div>
                  <div className="flex items-start mt-1">
                    {post.icon && <div className="mr-1 mt-0.5">{post.icon}</div>}
                    <p className="text-sm text-gray-700">{post.message}</p>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <button className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                      ❤️ {post.likes}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {posts.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No posts yet. Your neighbors will start sharing soon!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}