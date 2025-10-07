"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- Configuration for the Event ---
const eventDetails = {
  status: "Ongoing",
  name: "Enigma Orientation 2025",
  url: "/events"
};

export function BouncingEventBall() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const constraintsRef = useRef(null);
  const controls = useAnimationControls();
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
const router = useRouter();

  const bounce = useCallback(async () => {
    const ballSize = 24;
    const bounds = constraintsRef.current?.getBoundingClientRect();
    if (!bounds || isDragging.current) return;

    await controls.start({
      x: Math.random() * (bounds.width - ballSize),
      y: Math.random() * (bounds.height - ballSize),
      transition: { type: "spring", stiffness: 30, damping: 20, duration: 3 },
    });
    
    if (!isDragging.current) {
      bounce();
    }
  }, [controls]);

  useEffect(() => {
    const timeoutId = setTimeout(bounce, 1000);
    return () => clearTimeout(timeoutId);
  }, [bounce]);
  
  // NEW: useEffect to freeze the screen when the overlay is open.
  useEffect(() => {
    if (isOverlayOpen) {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            window.scrollTo(0, scrollY);
        };
    }
  }, [isOverlayOpen]);

  const handleTap = () => {
    // NEW: If a drag just happened, ignore the tap event.
    if (wasDragged.current) {
      return;
    }
    
    if (window.innerWidth < 1024) {
      setIsOverlayOpen(true);
    } else {
      router.push(eventDetails.url);
    }
  };

 return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 z-80 pointer-events-none" />

      <motion.div
        className="fixed w-6 h-6 rounded-full cursor-grab pointer-events-auto"
        style={{ zIndex: 90 }}
        animate={controls}
        drag
        dragConstraints={constraintsRef}
        dragMomentum={true}
        onTap={handleTap}
        onHoverStart={() => {
          if (!isDragging.current) {
            controls.stop();
            setIsTooltipVisible(true);
          }
        }}
        onHoverEnd={() => {
          if (!isDragging.current) {
            setIsTooltipVisible(false);
            bounce();
          }
        }}
        onDragStart={() => {
          isDragging.current = true;
          // NEW: Set the wasDragged flag on drag start
          wasDragged.current = true;
          setIsTooltipVisible(false);
          controls.stop();
        }}
        onDragEnd={() => {
          isDragging.current = false;
          // NEW: Reset the wasDragged flag after a tiny delay
          // This allows onTap to fire first and see the flag is true.
          setTimeout(() => {
            wasDragged.current = false;
          }, 50); // 50ms is a safe delay
          bounce();
        }}
      >
        <div className="w-full h-full rounded-full bg-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-125 active:cursor-grabbing" />

        <AnimatePresence>
          {isTooltipVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs p-3 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 pointer-events-none"
            >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {eventDetails.status}
                  </span>
                  <p className="text-sm text-white font-medium">{eventDetails.name}</p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      <AnimatePresence>
        {isOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center"
            // CHANGED: Increased z-index to a very high value
            style={{ zIndex: 9999 }}
          >
            <button
              onClick={() => setIsOverlayOpen(false)}
              className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={32} />
            </button>
            
            <Link href={eventDetails.url} className="group text-center text-white p-8 max-w-md">
              <h2 className="text-4xl font-bold mb-2 text-white transition-colors group-hover:text-blue-300">
                {eventDetails.name}
              </h2>
              <p className="text-lg text-green-400 font-medium mb-8">
                {eventDetails.status}
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-400 transition-colors group-hover:text-white">
                <span>View Event</span>
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}