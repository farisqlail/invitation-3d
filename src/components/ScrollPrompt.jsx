'use client';

import React from 'react';

export default function ScrollPrompt({ isVisible }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed top-[26%] left-1/2 -translate-x-1/2 z-25 pointer-events-none text-center transition-opacity duration-600 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="font-sans text-[0.86rem] font-normal tracking-[0.04em] text-white drop-shadow-[0_2px_14px_rgba(15,28,68,0.55)]">
        Scroll perlahan untuk memulai perjalanan
      </span>
    </div>
  );
}
