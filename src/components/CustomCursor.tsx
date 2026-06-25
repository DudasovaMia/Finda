import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Spring settings for super smooth trailing effect
  const springConfig = { damping: 25, stiffness: 220, mass: 0.6 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only enable custom cursor on desktop pointing devices (pointer: fine)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      // If the cursor is near the right edge (scrollbar zone), bottom edge, or other window boundaries,
      // temporarily restore the native cursor so scrollbars are 100% interactive and easy to click/drag.
      const boundaryThreshold = 20; 
      const isNearScrollbar = 
        e.clientX >= window.innerWidth - boundaryThreshold ||
        e.clientY >= window.innerHeight - boundaryThreshold ||
        e.clientX <= boundaryThreshold ||
        e.clientY <= boundaryThreshold;

      if (isNearScrollbar) {
        document.documentElement.classList.remove('cursor-none-global');
        setIsVisible(false);
      } else {
        document.documentElement.classList.add('cursor-none-global');
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      document.documentElement.classList.remove('cursor-none-global');
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      document.documentElement.classList.add('cursor-none-global');
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target && (
          target.closest('button') || 
          target.closest('a') || 
          target.closest('.cursor-pointer') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT'
        )
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    // Hide real cursor inside the application frame when using the custom cursor
    document.documentElement.classList.add('cursor-none-global');

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      document.documentElement.classList.remove('cursor-none-global');
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Glowing core dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-blue-500 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      {/* Outer halo tracker */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] border mix-blend-screen bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        animate={{
          width: isHovered ? 44 : 20,
          height: isHovered ? 44 : 20,
          opacity: isHovered ? 0.85 : 0.45,
          borderColor: isHovered ? 'rgba(59, 130, 246, 0.8)' : 'rgba(96, 165, 250, 0.25)',
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 22, mass: 0.3 }}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </>
  );
}
