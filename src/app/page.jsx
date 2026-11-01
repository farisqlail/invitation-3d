'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

const WalkthroughApp = dynamic(() => import('@/components/WalkthroughApp'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#243b82] text-white">
      <div className="flex flex-col items-center gap-3">
        <span className="font-serif text-2xl tracking-widest text-[#ffe2a8] animate-pulse">
          FARIS &amp; VITA
        </span>
        <span className="text-xs uppercase tracking-widest text-white/70">
          Memuat Pengalaman 3D...
        </span>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WalkthroughApp />
    </Suspense>
  );
}
