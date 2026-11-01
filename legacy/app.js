import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GardenWorld } from './world.js';
import { GardenAudioEngine } from './audio.js';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// MAIN CONTROLLER — PURE 3D WALKTHROUGH (FARIS & VITA)
// ============================================================================

const canvas = document.getElementById('webgl-canvas');
const world = new GardenWorld(canvas);
const audio = new GardenAudioEngine();

// 1. PERSONALIZED GUEST NAME VIA URL (?to=Budi+%26+Keluarga)
const params = new URLSearchParams(window.location.search);
const guestParam = params.get('to') || params.get('kepada');
if (guestParam) {
  const guestEl = document.getElementById('guest-name');
  if (guestEl) guestEl.textContent = guestParam;
}

// 2. START 60FPS WEBGL RENDER LOOP
function animate() {
  world.render();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// 3. GATE OPENING + AUDIO START CHOREOGRAPHY
const coverGate = document.getElementById('cover-gate');
const btnOpenGate = document.getElementById('btn-open-gate');
const scrollPrompt = document.getElementById('scroll-prompt');
const eqBars = document.getElementById('eq-bars');

function updateAudioUI(playing) {
  if (playing) {
    eqBars.classList.add('is-playing');
  } else {
    eqBars.classList.remove('is-playing');
  }
}

btnOpenGate.addEventListener('click', async () => {
  document.body.classList.remove('is-locked');
  coverGate.classList.add('is-opened');

  await audio.start();
  updateAudioUI(true);

  const gateState = { open: 0, introProgress: 0 };
  gsap.to(gateState, {
    open: 1,
    duration: 2.2,
    ease: 'power3.out',
    onUpdate: () => world.setGateOpen(gateState.open)
  });

  gsap.to(gateState, {
    introProgress: 0.05,
    duration: 2.0,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (window.scrollY < 10) {
        world.setScrollProgress(gateState.introProgress);
      }
    },
    onComplete: () => {
      scrollPrompt.classList.add('is-visible');
      ScrollTrigger.refresh();
    }
  });
});

// 4. AUDIO MUTE/UNMUTE TOGGLE (TOP LEFT EQUALIZER BARS)
document.getElementById('audio-toggle-btn').addEventListener('click', () => {
  const isNowPlaying = audio.toggleMute();
  updateAudioUI(isNowPlaying);
});

// 5. GSAP SCROLLTRIGGER — BIND SCROLL TO 3D SPLINE RAIL
ScrollTrigger.create({
  trigger: '#scroll-track',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 0.5,
  onUpdate: (self) => {
    const p = 0.05 + self.progress * 0.95;
    world.setScrollProgress(p);

    if (self.progress > 0.02) {
      scrollPrompt.classList.remove('is-visible');
    }
  }
});
