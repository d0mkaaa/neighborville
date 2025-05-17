import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function BackgroundBubbles() {
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    size: number;
    startX: number;
    startY: number;
    speedX: number;
    speedY: number;
    opacity: number;
    currentX: number;
    currentY: number;
  }>>([]);
  
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }, (_, i) => {
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      return {
        id: i,
        size: 60 + Math.random() * 80,
        startX,
        startY,
        currentX: startX,
        currentY: startY,
        speedX: 0.2 + Math.random() * 0.3,
        speedY: 0.2 + Math.random() * 0.3,
        opacity: 0.2 + Math.random() * 0.3
      };
    });
    
    setBubbles(newBubbles);
    
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    let animationFrameId: number;
    let isComponentMounted = true;
    
    const updateBubblePositions = () => {
      if (!isComponentMounted) return;
      
      setBubbles(prevBubbles => 
        prevBubbles.map(bubble => ({
          ...bubble,
          currentX: bubble.startX + (mousePositionRef.current.x * bubble.speedX * 0.05),
          currentY: bubble.startY + (mousePositionRef.current.y * bubble.speedY * 0.05),
        }))
      );
      
      animationFrameId = requestAnimationFrame(updateBubblePositions);
    };
    
    animationFrameId = requestAnimationFrame(updateBubblePositions);
    
    return () => {
      isComponentMounted = false;
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-white bg-opacity-10"
          style={{
            width: bubble.size,
            height: bubble.size,
            filter: 'blur(1px)',
            top: 0,
            left: 0,
            opacity: bubble.opacity,
            transform: `translate(${bubble.currentX}px, ${bubble.currentY}px)`,
          }}
        />
      ))}
    </div>
  );
}