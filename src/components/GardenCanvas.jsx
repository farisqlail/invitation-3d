'use client';

import React, { useEffect, useRef } from 'react';
import { GardenWorld } from '../world.js';

export default function GardenCanvas({ onWorldReady }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const world = new GardenWorld(canvasRef.current);
    if (onWorldReady) {
      onWorldReady(world);
    }

    let animId;
    let isPaused = false;

    function animate() {
      if (!isPaused) {
        world.render();
      }
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    const handleVisibility = () => {
      isPaused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (typeof world.destroy === 'function') {
        world.destroy();
      }
    };
  }, [onWorldReady]);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        aria-hidden="true"
        className="fixed inset-0 w-screen h-screen h-[100dvh] z-1 block pointer-events-none"
      />
      <div className="atmosphere-overlay" aria-hidden="true" />
    </>
  );
}
