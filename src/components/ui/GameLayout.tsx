import React from 'react';

interface GameLayoutProps {
  header: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar?: React.ReactNode;
  mainContent: React.ReactNode;
  children?: React.ReactNode;
}

export default function GameLayout({
  header,
  leftSidebar,
  rightSidebar,
  mainContent,
  children
}: GameLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-pink-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pattern-polka-dots pattern-pink-200 pattern-bg-transparent pattern-size-6 pattern-opacity-10"></div>
      
      <div className="z-10 sticky top-0 w-full bg-orange-500 shadow-md">
        {header}
      </div>
      
      <div className="flex-grow flex z-10 relative">
        <div className="w-80 p-3 flex-shrink-0 overflow-y-auto no-scrollbar">
          {leftSidebar}
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto overflow-x-hidden">
          {mainContent}
        </div>
        
        {rightSidebar && (
          <div className="w-80 p-3 flex-shrink-0 overflow-y-auto no-scrollbar">
            {rightSidebar}
          </div>
        )}
      </div>
      
      {children}
      
    </div>
  );
}