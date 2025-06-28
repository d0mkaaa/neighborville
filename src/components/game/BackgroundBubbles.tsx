import { useState, useEffect, useRef } from "react";

interface Bubble {
  id: number;
  size: number;
  startX: number;
  startY: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function BackgroundBubbles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const bubblesDataRef = useRef<Bubble[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }, (_, i) => {
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      return {
        id: i,
        size: 60 + Math.random() * 80,
        startX,
        startY,
        speedX: 0.2 + Math.random() * 0.3,
        speedY: 0.2 + Math.random() * 0.3,
        opacity: 0.2 + Math.random() * 0.3
      };
    });
    
    bubblesDataRef.current = newBubbles;
    setBubbles(newBubbles);
    
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    let animationFrameId: number;
    let isComponentMounted = true;
    
    const updateBubblePositions = () => {
      if (!isComponentMounted || !containerRef.current) return;
      
      const bubbleElements = containerRef.current.children;
      
      bubblesDataRef.current.forEach((bubble, index) => {
        const element = bubbleElements[index] as HTMLElement;
        if (element) {
          const currentX = bubble.startX + (mousePositionRef.current.x * bubble.speedX * 0.05);
          const currentY = bubble.startY + (mousePositionRef.current.y * bubble.speedY * 0.05);
          element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
      });
      
      animationFrameId = requestAnimationFrame(updateBubblePositions);
    };
    
    
    setTimeout(() => {
      if (isComponentMounted) {
        animationFrameId = requestAnimationFrame(updateBubblePositions);
      }
    }, 100);
    
    return () => {
      isComponentMounted = false;
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-white bg-opacity-10"
          style={{
            width: bubble.size,
            height: bubble.size,
            filter: 'blur(1px)',
            top: 0,
            left: 0,
            opacity: bubble.opacity,
            transform: `translate(${bubble.startX}px, ${bubble.startY}px)`,
            willChange: 'transform'
          }}
        />
      ))}
    </div>
  );
}