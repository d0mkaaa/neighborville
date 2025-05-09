import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function BackgroundBubbles() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    size: number;
    startX: number;
    startY: number;
    speedX: number;
    speedY: number;
    opacity: number;
  }>>([]);
  
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: 60 + Math.random() * 80,
      startX: Math.random() * window.innerWidth,
      startY: Math.random() * window.innerHeight,
      speedX: 0.2 + Math.random() * 0.3,
      speedY: 0.2 + Math.random() * 0.3,
      opacity: 0.2 + Math.random() * 0.3
    }));
    
    setBubbles(newBubbles);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-white bg-opacity-10"
          initial={{ 
            x: bubble.startX, 
            y: bubble.startY,
            opacity: bubble.opacity
          }}
          animate={{ 
            x: bubble.startX + (mousePosition.x * bubble.speedX),
            y: bubble.startY + (mousePosition.y * bubble.speedY),
            opacity: [bubble.opacity, bubble.opacity + 0.1, bubble.opacity]
          }}
          transition={{
            x: { type: "spring", stiffness: 10, damping: 30 },
            y: { type: "spring", stiffness: 10, damping: 30 },
            opacity: { duration: 5, repeat: Infinity, repeatType: "reverse" }
          }}
          style={{
            width: bubble.size,
            height: bubble.size,
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
  );
}