'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GardenAudioEngine } from '../audio.js';
import GardenCanvas from './GardenCanvas.jsx';
import AtmosHeader from './AtmosHeader.jsx';
import CoverGate from './CoverGate.jsx';
import ScrollPrompt from './ScrollPrompt.jsx';
import ScrollTrack from './ScrollTrack.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function WalkthroughApp() {
  const searchParams = useSearchParams();
  const guestQuery = searchParams ? (searchParams.get('to') || searchParams.get('kepada')) : null;

  const [world, setWorld] = useState(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);
  const [guestName, setGuestName] = useState(guestQuery || 'Tamu Kehormatan');

  const audioRef = useRef(null);

  // Sync if query changes
  useEffect(() => {
    if (guestQuery) {
      setGuestName(guestQuery);
    }
  }, [guestQuery]);

  // Initialize Audio Engine once
  useEffect(() => {
    audioRef.current = new GardenAudioEngine();
    return () => {
      if (audioRef.current?.loopTimer) {
        clearInterval(audioRef.current.loopTimer);
      }
    };
  }, []);

  // Body scroll lock management
  useEffect(() => {
    if (!isGateOpen) {
      document.body.classList.add('overflow-hidden', 'h-[100dvh]');
    } else {
      document.body.classList.remove('overflow-hidden', 'h-[100dvh]');
    }
    return () => {
      document.body.classList.remove('overflow-hidden', 'h-[100dvh]');
    };
  }, [isGateOpen]);

  const handleWorldReady = useCallback((worldInstance) => {
    setWorld(worldInstance);
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    const isNowPlaying = audioRef.current.toggleMute();
    setIsPlaying(isNowPlaying);
  }, []);

  const handleOpenGate = useCallback(async () => {
    setIsGateOpen(true);

    if (audioRef.current) {
      try {
        await audioRef.current.start();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio auto-play failed:', err);
      }
    }

    const gateState = { open: 0, introProgress: 0 };

    gsap.to(gateState, {
      open: 1,
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => {
        if (world) world.setGateOpen(gateState.open);
      }
    });

    gsap.to(gateState, {
      introProgress: 0.05,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (world && window.scrollY < 10) {
          world.setScrollProgress(gateState.introProgress);
        }
      },
      onComplete: () => {
        setShowScrollPrompt(true);
        ScrollTrigger.refresh();
      }
    });
  }, [world]);

  const handleScrollChange = useCallback((progress) => {
    if (progress > 0.02) {
      setShowScrollPrompt(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-[#243b82] text-white font-sans selection:bg-[#ffe2a8] selection:text-[#213c8b]">
      {/* 1. FIXED 3D WEBGL CANVAS & ATMOSPHERE VIGNETTE */}
      <GardenCanvas onWorldReady={handleWorldReady} />

      {/* 2. MINIMAL ATMOS TOP HEADER (EQUALIZER + FARIS & VITA LOGO) */}
      <AtmosHeader
        isPlaying={isPlaying}
        onToggleAudio={handleToggleAudio}
      />

      {/* 3. COVER GATE SCREEN */}
      <CoverGate
        isOpened={isGateOpen}
        guestName={guestName}
        onOpenGate={handleOpenGate}
      />

      {/* 4. SCROLL PROMPT */}
      <ScrollPrompt isVisible={showScrollPrompt} />

      {/* 5. 850vh SCROLL TRACK DRIVING 3D SPLINE CAMERA */}
      <ScrollTrack
        world={world}
        onScrollChange={handleScrollChange}
      />
    </div>
  );
}
