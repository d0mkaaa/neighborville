import React from 'react';
import { Github, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="relative">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-md border-t border-white/10" />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-gray-700 mb-2 md:mb-0">
              <span>Created with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                <Heart size={14} className="text-red-500" />
              </motion.div>
              <span>by</span>
              <a 
                href="https://github.com/d0mkaaa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                d0mkaaa
              </a>
              <span>for</span>
              <a 
                href="https://neighborhood.hackclub.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                neighborhood.hackclub.com
              </a>
            </div>
            
            <motion.a 
              href="https://github.com/d0mkaaa/neighborville" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github size={16} />
              <span>Source Code</span>
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}