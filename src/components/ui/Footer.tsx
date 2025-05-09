import React from 'react';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white py-3 px-4 shadow-inner z-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between text-sm">
        <div className="flex items-center">
          <span>Created by</span>
          <a 
            href="https://github.com/d0mkaaa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium mx-1 text-orange-300 hover:text-orange-200 transition-colors"
          >
            d0mkaaa
          </a>
          <span>for</span>
          <a 
            href="https://neighborhood.hackclub.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium mx-1 text-orange-300 hover:text-orange-200 transition-colors"
          >
            neighborhood.hackclub.com
          </a>
        </div>
        
        <a 
          href="https://github.com/d0mkaaa/neighborville" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-orange-300 hover:text-orange-200 transition-colors mt-2 md:mt-0"
        >
          <Github size={16} className="mr-1" />
          <span>Source Code</span>
        </a>
      </div>
    </footer>
  );
}