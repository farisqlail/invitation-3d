'use client';

import React from 'react';

export default function CoverGate({ isOpened, guestName, onOpenGate }) {
  return (
    <section
      className={`fixed inset-0 z-55 flex items-center justify-center p-6 bg-gradient-to-b from-[#16308a]/80 via-[#4e6cc6]/70 to-[#dce4fa]/60 backdrop-blur-sm sm:backdrop-blur-md will-change-[opacity,visibility] transition-all duration-1000 ${
        isOpened ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
      }`}
    >
      <div className="text-center max-w-[680px] w-full flex flex-col items-center">
        {/* Title Wrap with Rotating Circular Badge */}
        <div className="relative inline-block px-9 pt-6 pb-2">
          <h1 className="font-serif font-light text-[clamp(2.8rem,11vw,5.8rem)] tracking-[0.08em] leading-none text-white drop-shadow-[0_8px_32px_rgba(18,35,90,0.35)]">
            FARIS <em className="italic font-light text-[#ffe2a8]">&amp;</em> VITA
          </h1>

          {/* Rotating circular badge like ATMOS */}
          <div className="absolute -top-3 -right-3.5 w-24 h-24 text-white/90 animate-spin-slow pointer-events-none">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <defs>
                <path
                  id="circlePath"
                  d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                />
              </defs>
              <text fill="currentColor" fontSize="8.3" letterSpacing="2.3">
                <textPath href="#circlePath">
                  THE WEDDING GARDEN WALKTHROUGH • 10.01.2027 •
                </textPath>
              </text>
            </svg>
          </div>
        </div>

        {/* Date & Location */}
        <p className="text-[0.92rem] tracking-[0.16em] uppercase text-white/90 mt-1.5 mb-7">
          Minggu, 10 Januari 2027 — Surabaya
        </p>

        {/* Guest Name (no card) */}
        <div className="mb-9 flex flex-col items-center gap-1">
          <span className="text-[0.82rem] tracking-[0.12em] uppercase text-white/80 font-normal">
            Kepada Yth.
          </span>
          <strong className="font-serif text-[1.65rem] font-medium tracking-[0.04em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
            {guestName || 'Tamu Kehormatan'}
          </strong>
        </div>

        {/* Explore Button */}
        <button
          type="button"
          onClick={onOpenGate}
          className="bg-white text-[#213c8b] border-none rounded-full px-10 py-3.5 font-serif text-[0.95rem] font-semibold tracking-[0.16em] cursor-pointer shadow-[0_12px_34px_rgba(17,32,82,0.28)] transition-all duration-250 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(17,32,82,0.38)] active:scale-95"
        >
          <span>BUKA UNDANGAN</span>
        </button>
      </div>
    </section>
  );
}
