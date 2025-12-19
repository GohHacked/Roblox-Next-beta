import React, { useEffect, useRef, useState } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onJump: () => void;
  onLook: (dx: number, dy: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onJump, onLook }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  
  // Track specific touch IDs
  const moveTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  // Joystick Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // Left side of screen for movement if not hitting specific buttons, 
      // but we use a specific zone for the joystick
      if (moveTouchId.current === null && t.clientX < window.innerWidth / 2) {
        moveTouchId.current = t.identifier;
        updateJoystick(t.clientX, t.clientY);
      }
      // Right side for looking (if not jump button)
      else if (lookTouchId.current === null && t.clientX > window.innerWidth / 2) {
         lookTouchId.current = t.identifier;
         lastLookPos.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 40;
    
    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxRadius;
      dy = Math.sin(angle) * maxRadius;
    }
    
    setJoystickPos({ x: dx, y: dy });
    onMove(dx / maxRadius, -dy / maxRadius);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveTouchId.current) {
        updateJoystick(t.clientX, t.clientY);
      }
      if (t.identifier === lookTouchId.current) {
        const dx = t.clientX - lastLookPos.current.x;
        const dy = t.clientY - lastLookPos.current.y;
        onLook(dx, dy);
        lastLookPos.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setJoystickPos({ x: 0, y: 0 });
        onMove(0, 0);
      }
      if (t.identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  };

  return (
    <div 
      className="absolute inset-0 z-40 select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Joystick Area Container */}
      <div className="absolute bottom-16 left-12 w-32 h-32 bg-white/5 rounded-full backdrop-blur-[2px] border border-white/10 flex items-center justify-center pointer-events-none">
         {/* Knob */}
         <div 
            ref={joystickRef}
            className="w-12 h-12 bg-white/40 rounded-full shadow-lg border border-white/50"
            style={{ 
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              transition: moveTouchId.current ? 'none' : 'transform 0.1s ease-out'
            }}
         />
      </div>

      {/* Jump Button */}
      <div 
         className="absolute bottom-20 right-10 w-20 h-20 bg-white/10 rounded-full backdrop-blur-md border border-white/20 active:bg-white/30 flex items-center justify-center pointer-events-auto transition-colors"
         onTouchStart={(e) => {
             e.stopPropagation();
             onJump();
         }}
      >
        <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center">
            <span className="font-bold text-white/90 text-[10px] tracking-widest">JUMP</span>
        </div>
      </div>
    </div>
  );
};