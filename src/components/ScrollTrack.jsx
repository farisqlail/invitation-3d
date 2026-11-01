'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollTrack({ world, onScrollChange }) {
  const trackRef = useRef(null);

  useEffect(() => {
    if (!world || !trackRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const p = 0.05 + self.progress * 0.95;
        world.setScrollProgress(p);
        if (onScrollChange) {
          onScrollChange(self.progress);
        }
      }
    });

    return () => {
      trigger.kill();
    };
  }, [world, onScrollChange]);

  return (
    <main
      ref={trackRef}
      id="scroll-track"
      className="relative z-10 w-full h-[850vh] pointer-events-none"
      aria-label="Perjalanan 3D Pernikahan Faris dan Vita"
    />
  );
}
