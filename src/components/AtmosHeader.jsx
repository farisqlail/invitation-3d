'use client';

import React from 'react';

export default function AtmosHeader({ isPlaying, onToggleAudio }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-45 grid grid-cols-3 items-center px-5 py-5 md:px-11 md:py-6 pointer-events-none">
      {/* Header Left: Audio Toggle Button */}
      <div className="flex items-center justify-start pointer-events-auto">
        <button
          type="button"
          onClick={onToggleAudio}
          className="bg-transparent border-0 text-white px-2 py-1.5 inline-flex items-center cursor-pointer opacity-90 transition-all duration-200 hover:opacity-100 hover:scale-105 active:scale-95"
          aria-label="Toggle Musik"
          title={isPlaying ? 'Mute Musik' : 'Nyalakan Musik'}
        >
          <div className="inline-flex items-end gap-[2.5px] h-3.5">
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-1' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-2' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-3' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-4' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-5' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-6' : 'h-[3px] opacity-40'}`}></span>
            <span className={`w-[1.5px] bg-white rounded-xs transition-[height] duration-200 ${isPlaying ? 'h-[3px] eq-bar-7' : 'h-[3px] opacity-40'}`}></span>
          </div>
        </button>
      </div>

      {/* Header Center: Logo */}
      <div className="flex items-center justify-center pointer-events-auto">
        <span className="font-serif text-[clamp(1.15rem,3.5vw,1.55rem)] font-normal tracking-[0.16em] text-white select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
          FARIS <span className="italic text-[#ffe2a8]">&amp;</span> VITA
        </span>
      </div>

      {/* Header Right spacer */}
      <div className="flex items-center justify-end pointer-events-auto"></div>
    </header>
  );
}
