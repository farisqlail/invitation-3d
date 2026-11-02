'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const HERO_SLIDES = [
  '/assets/photos/hero-1.png',
  '/assets/photos/hero-2.png',
  '/assets/photos/hero-3.png',
];

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Bangsal+Pancasila+UWKS+Jl.+Dukuh+Kupang+XXV+No.54+Surabaya';

export default function WeddingInvitation() {
  const [splashDone, setSplashDone] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const audioRef = useRef(null);
  const touchStartXRef = useRef(0);

  // Splash timer & URL guest param
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true);
    }, 1350);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const toParam = params.get('to') || params.get('kepada') || '';
      if (toParam.trim()) {
        setGuestName(toParam.trim());
      }
    }

    return () => clearTimeout(timer);
  }, []);

  // Autoplay Hero Carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation for Hero Carousel
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Scroll Reveal IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const elements = document.querySelectorAll('.s-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));
    } else {
      audio.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX > 50) {
      setSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    } else if (deltaX < -50) {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }
  };

  return (
    <div className="s-page-root">
      {/* Musik Latar */}
      <audio
        ref={audioRef}
        src="/audio/waking-up-together-with-you.mp3"
        loop
        preload="none"
      />

      <button
        type="button"
        onClick={toggleAudio}
        className={`s-audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
        aria-label={isPlayingAudio ? 'Matikan musik pernikahan' : 'Nyalakan musik pernikahan'}
      >
        <span className="s-audio-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>{isPlayingAudio ? 'Musik Aktif' : 'Musik Hening'}</span>
      </button>

      {/* 1. LAYAR PEMBUKA SPLASH (Soft Cream #F4EFE6 + logo-dark.svg) */}
      <div className={`s-splash ${splashDone ? 'is-hidden' : ''}`} aria-hidden={splashDone}>
        <img
          src="/assets/logo-dark.svg"
          alt="Pawarto Palakrama Faris & Vita"
          className="s-splash__logo"
        />
      </div>

      {/* 2. STICKY FULLSCREEN HERO CAROUSEL (FVカルーセル) */}
      <section
        className="s-fv-sticky"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Galeri Utama Pernikahan"
      >
        <div className="s-fv-slides">
          {HERO_SLIDES.map((src, idx) => (
            <div
              key={src}
              className={`s-fv-slide ${idx === slideIndex ? 'is-active' : ''}`}
            >
              <img
                src={src}
                alt={`Foto Pernikahan Faris & Vita ${idx + 1}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        <div className="s-fv-overlay">
          <div className="s-fv-logo-wrap">
            <img
              src="/assets/logo-hero.svg"
              alt="Undangan Pernikahan Faris & Vita"
              className="s-fv-logo"
            />
          </div>

          <div className="s-fv-caption-row">
            {guestName && (
              <div className="s-fv-guest-pill">
                <span>
                  <span className="s-aksara" style={{ marginRight: '6px' }}>ꦏꦠꦸꦂ ꦥꦚ꧀ꦗꦼꦤꦼꦔꦤꦶꦥꦸꦤ꧀:</span>
                  {guestName}
                </span>
              </div>
            )}
            <p className="s-fv-caption">
              Dengan penuh rasa syukur dan sukacita, kami mengumumkan bahwa akad nikah
              serta resepsi pernikahan kami akan diselenggarakan pada hari Minggu,
              10 Januari 2027 di Bangsal Pancasila UWKS Surabaya. Segala persiapan tulus
              kami hadirkan sebagai ungkapan terima kasih mendalam kepada Bapak/Ibu/Saudara/i
              yang senantiasa mendoakan dan mendampingi langkah kami. Kehadiran serta doa
              restu Anda merupakan kehormatan terbesar bagi kami untuk mengawali perjalanan
              hidup baru ini.
            </p>
          </div>

          {/* Kartu Melayang Desktop Menuju Arsip Kenangan */}
          <Link href="/archive" className="s-fv-card-desktop">
            <div className="s-fv-card-top">
              <img
                src="/assets/photos/special-thumb.png"
                alt="Arsip Kenangan Bahagia"
                className="s-fv-card-thumb"
              />
              <div className="s-fv-card-title s-aksara">
                ꦩꦠꦸꦂ
                <br />
                ꦤꦸꦮꦸꦤ꧀
              </div>
            </div>
            <div className="s-fv-card-bottom">
              <div className="s-fv-card-sub">
                Cerita &amp; galeri
                <br />
                hari bahagia
              </div>
              <div className="s-fv-card-arrow">
                <img src="/assets/arrow-right.svg" alt="" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Spanduk Khusus Tablet & Ponsel */}
      <div className="s-fv-card-mobile-wrap">
        <Link href="/archive" className="s-fv-card-mobile">
          <img
            src="/assets/wakusei-sm.svg"
            alt=""
            className="s-fv-card-mobile__orbit"
          />
          <img
            src="/assets/photos/special-thumb.png"
            alt="Arsip Kenangan Bahagia"
            className="s-fv-card-thumb"
          />
          <div className="s-fv-card-mobile__row">
            <div className="s-fv-card-title s-aksara">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="s-fv-card-sub">
                Cerita &amp; galeri
                <br />
                hari bahagia
              </span>
              <span className="s-fv-card-arrow">
                <img src="/assets/arrow-right.svg" alt="" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. SECTION 1: SOFT CREAM (#F4EFE6) SALAM MENYAMPING + KOLASE FOTO + PROFIL */}
      <section className="s-lime-section">
        {/* Tata Letak Menyamping: Teks di Kiri (Sticky), Foto Berjalan di Kanan (Tidak Tertutup) */}
        <div className="s-greeting-parallax-wrap">
          {/* Kolom Kiri: Teks Undangan & Bahasa Jawa */}
          <div className="s-greeting-sticky-col">
            <img
              src="/assets/wakusei-lg.svg"
              alt=""
              className="s-greeting-orbit s-reveal s-reveal--up-sm"
            />

            <div className="s-greeting-inner">
              <div className="s-greeting-top-row s-reveal">
                <p className="s-greeting-id-text">
                  Bismillahirrohmanirrohim.
                  <br />
                  Dengan memohon rahmat dan ridho Allah SWT,
                  <br />
                  kami bermaksud menyelenggarakan pernikahan putra-putri kami.
                  <br />
                  Sebagai wujud rasa syukur kepada Bapak/Ibu/Saudara/i yang senantiasa
                  mendukung serta mendoakan langkah kami, kami mengundang kehadiran Anda
                  untuk berbagi kebahagiaan pada hari istimewa ini.
                  <br />
                  Merupakan suatu kehormatan dan kebahagiaan mendalam apabila Anda
                  berkenan hadir serta memberikan doa restu.
                </p>
                {/* Tanda Air Aksara Jawa: Katur (Dihaturkan) */}
                <div className="s-greeting-watermark s-aksara" aria-hidden="true">
                  ꦏ
                  <br />
                  ꦠꦸꦂ
                </div>
              </div>

              {/* Teks Pendamping Bahasa Jawa dalam Aksara Jawa */}
              <p className="s-greeting-jawa-text s-aksara s-reveal delay-200">
                ꦏꦠꦸꦂ ꦥꦚ꧀ꦗꦼꦤꦼꦔꦤꦶꦥꦸꦤ꧀ ꦥꦫ ꦱꦼꦱꦼꦥꦸꦃ꧈ ꦥꦶꦤꦶꦱꦼꦥꦸꦃ꧈ ꦱꦲ ꦥꦫ ꦫꦮꦸꦃ ꦲꦶꦁꦏꦁ ꦢꦲꦠ꧀ ꦏꦶꦤꦸꦂꦩꦠꦤ꧀꧉ ꦲꦮꦶꦠ꧀ ꦱꦏꦶꦁ ꦧꦼꦂꦏꦃ ꦱꦲ ꦫꦃꦩꦠꦶꦥꦸꦤ꧀ ꦒꦸꦱ꧀ꦠꦶ ꦲꦶꦁꦏꦁ ꦩꦲ ꦲꦒꦸꦁ꧈ ꦏꦸꦭ ꦱꦏꦭꦶꦪꦤ꧀ ꦧꦝꦺ ꦔ꧀ꦭꦼꦏ꧀ꦱꦤꦤꦶ ꦥꦮꦂꦠꦺꦴꦱ꧀ ꦱꦸꦕꦶ ꦥꦭꦏꦿꦩ꧉ ꦥꦚꦸꦮꦸꦤ꧀ ꦏꦸꦭ ꦱꦏꦭꦶꦪꦤ꧀꧈ ꦩꦸꦒꦶ ꦒꦸꦱ꧀ꦠꦶ ꦠꦤ꧀ꦱꦃ ꦥꦫꦶꦁ ꦧꦼꦂꦏꦃ꧈ ꦏꦠꦼꦤ꧀ꦠꦽꦩꦤ꧀꧈ ꦱꦲ ꦏꦫꦲꦂꦗꦤ꧀ ꦝꦸꦩꦠꦼꦁ ꦱꦼꦢꦪ ꦭꦩ꧀ꦥꦃ ꦏꦸꦭ ꦱꦏꦭꦶꦪꦤ꧀ ꦲꦶꦁ ꦠꦼꦩ꧀ꦧꦺ ꦧꦸꦫꦶ꧉
              </p>
            </div>
          </div>

          {/* Kolom Kanan: 6 Foto Kolase Mengalir Elegan Tanpa Menutupi Teks */}
          <div className="s-collage-scroll-col">
            <div className="s-collage-subcol">
              <div className="s-collage-img s-collage-img--square s-reveal">
                <img
                  src="/assets/photos/collage-1.png"
                  alt="Kenangan Bersama 1"
                  loading="lazy"
                />
              </div>
              <div className="s-collage-img s-collage-img--tall s-reveal delay-200">
                <img
                  src="/assets/photos/collage-2.png"
                  alt="Kenangan Bersama 2"
                  loading="lazy"
                />
              </div>
              <div className="s-collage-img s-collage-img--wide s-reveal delay-400">
                <img
                  src="/assets/photos/collage-3.png"
                  alt="Kenangan Bersama 3"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="s-collage-subcol s-collage-subcol--offset">
              <div className="s-collage-img s-collage-img--tall s-reveal delay-200">
                <img
                  src="/assets/photos/collage-4.png"
                  alt="Kenangan Bersama 4"
                  loading="lazy"
                />
              </div>
              <div className="s-collage-img s-collage-img--wide s-reveal delay-400">
                <img
                  src="/assets/photos/collage-5.png"
                  alt="Kenangan Bersama 5"
                  loading="lazy"
                />
              </div>
              <div className="s-collage-img s-collage-img--tall s-reveal delay-600">
                <img
                  src="/assets/photos/collage-6.png"
                  alt="Kenangan Bersama 6"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profil Mempelai Wanita — Vita */}
        <div className="s-profile-section">
          <div className="s-profile-photos-row">
            <div className="s-profile-small-pair">
              <div className="s-profile-img-tall s-reveal s-reveal--fade">
                <img
                  src="/assets/photos/vita-1.png"
                  alt="Ardina Vita Rika Pratiwi — Potret 1"
                  loading="lazy"
                />
              </div>
              <div className="s-profile-img-wide s-reveal s-reveal--fade delay-800">
                <img
                  src="/assets/photos/vita-2.png"
                  alt="Ardina Vita Rika Pratiwi — Potret 2"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="s-profile-img-hero s-reveal s-reveal--fade delay-1200">
              <img
                src="/assets/photos/vita-3.png"
                alt="Ardina Vita Rika Pratiwi — Potret Utama"
                loading="lazy"
              />
            </div>
          </div>

          <div className="s-profile-bio s-reveal">
            <h2 className="s-profile-name">Vita</h2>
            <div>
              <div className="s-profile-fullname">Ardina Vita Rika Pratiwi</div>
              <p className="s-profile-desc">
                Putri dari Bapak Hariyanto
                <br />
                &amp; Ibu Retno Soelistyowati
                <br />
                Tumbuh dalam kehangatan keluarga di Sidoarjo, sosok yang penuh perhatian,
                menyukai ketenangan, perjalanan, serta momen-momen sederhana yang bermakna.
              </p>
            </div>
          </div>
        </div>

        {/* Profil Mempelai Pria — Faris */}
        <div className="s-profile-section s-profile-section--groom">
          <div className="s-profile-photos-row">
            <div className="s-profile-img-hero s-reveal s-reveal--fade delay-1200">
              <img
                src="/assets/photos/faris-1.png"
                alt="Faris Rizqilail — Potret Utama"
                loading="lazy"
              />
            </div>

            <div className="s-profile-small-pair">
              <div className="s-profile-img-wide s-reveal s-reveal--fade delay-800">
                <img
                  src="/assets/photos/faris-2.png"
                  alt="Faris Rizqilail — Potret 1"
                  loading="lazy"
                />
              </div>
              <div className="s-profile-img-tall s-reveal s-reveal--fade">
                <img
                  src="/assets/photos/faris-3.png"
                  alt="Faris Rizqilail — Potret 2"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="s-profile-bio s-profile-bio--groom s-reveal">
            <h2 className="s-profile-name">Faris</h2>
            <div>
              <div className="s-profile-fullname">Faris Rizqilail</div>
              <p className="s-profile-desc">
                Putra kedua dari Bapak Dadang Indarto
                <br />
                &amp; Ibu Agustin Sulistyorini
                <br />
                Tumbuh dalam kehangatan keluarga di Surabaya, sosok yang penuh perhitungan,
                menyukai ketenangan, berbagi kenangan, serta hal-hal kecil yang sederhana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 2: CHARCOAL GELAP (#1A1A1A) JADWAL & LOKASI ACARA */}
      <section className="s-dark-section">
        <div className="s-dark-container">
          {/* Baris 1: Hari & Tanggal (Dinten & Surya) */}
          <div className="s-schedule-row s-reveal">
            <div className="s-schedule-label-group">
              <span className="s-schedule-label-en">Hari &amp; Tanggal</span>
              <span className="s-schedule-label-sub s-aksara">ꦢꦶꦤ꧀ꦠꦼꦤ꧀ꦭꦤ꧀ꦱꦸꦂꦪ</span>
            </div>
            <div className="s-schedule-value-day">Minggu, 10 Januari 2027</div>
          </div>

          {/* Baris 2: Akad Nikah (Ijab Qobul) */}
          <div className="s-schedule-row s-reveal">
            <div className="s-schedule-label-group">
              <span className="s-schedule-label-en">Akad Nikah</span>
              <span className="s-schedule-label-sub s-aksara">ꦲꦶꦗꦧ꧀ꦏꦺꦴꦧꦸꦭ꧀</span>
            </div>
            <div className="s-schedule-value-time">08:00 WIB</div>
          </div>

          {/* Baris 3: Resepsi Pernikahan (Pahargyan Temanten) */}
          <div className="s-schedule-row s-reveal">
            <div className="s-schedule-label-group">
              <span className="s-schedule-label-en">Resepsi Pernikahan</span>
              <span className="s-schedule-label-sub s-aksara">ꦥꦲꦂꦒꦾꦤ꧀ꦠꦼꦩꦤ꧀ꦠꦺꦤ꧀</span>
            </div>
            <div className="s-schedule-value-time">11:00 WIB</div>
          </div>

          <p className="s-schedule-note s-reveal">
            Registrasi tamu dilakukan langsung di pintu utama gedung sebelum acara dimulai.
            Kehadiran tepat waktu dan doa restu Bapak/Ibu/Saudara/i merupakan kebahagiaan
            serta kehormatan besar bagi kami sekeluarga.
          </p>
        </div>

        {/* Blok Lokasi Acara (Sasana Pahargyan) */}
        <div className="s-place-container">
          <div className="s-place-header s-reveal">
            <span className="s-schedule-label-en">Lokasi Acara</span>
            <span className="s-schedule-label-sub s-aksara">ꦱꦱꦤꦥꦲꦂꦒꦾꦤ꧀</span>
          </div>

          <div className="s-place-body">
            <div className="s-place-left">
              <div className="s-place-title-group s-reveal">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="s-place-title-link"
                >
                  <span className="s-place-title-text">
                    Bangsal
                    <br />
                    Pancasila
                    <br />
                    Surabaya
                  </span>
                  <img
                    src="/assets/external-lg.svg"
                    alt="Buka Petunjuk Arah di Google Maps"
                    className="s-place-ext-lg"
                  />
                </a>
                <p className="s-place-address">
                  Jl. Dukuh Kupang XXV No.54, Dukuh Kupang, Kec. Dukuhpakis, Surabaya,
                  Jawa Timur
                </p>
              </div>

              <p className="s-place-access s-reveal delay-200">
                Kampus Universitas Wijaya Kusuma Surabaya (UWKS)
                <br />
                Akses sangat mudah melalui Gerbang Tol Satelit / Jl. Mayjen Sungkono Surabaya
              </p>
            </div>

            <div className="s-reveal delay-400">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="s-place-map-link"
              >
                <span>Petunjuk Arah Google Maps</span>
                <img
                  src="/assets/external-sm.svg"
                  alt=""
                  className="s-place-ext-sm"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 3: JENDELA TRANSPARAN 100VH (Menyingkap Kembali Carousel di Bawah) */}
      <div className="s-transparent-window" aria-hidden="true" />

      {/* 6. SECTION 4: SOFT CREAM (#F4EFE6) MATUR NUWUN SANGET */}
      <section className="s-bottom-lime-section">
        {/* Blok Rasa Syukur & Terima Kasih (Matur Nuwun Sanget) */}
        <div className="s-thanks-block">
          <h2 className="s-thanks-heading s-reveal">
            <span className="s-aksara">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀ꦱꦔꦼꦠ꧀</span>
            <span className="s-thanks-sub-id">Matur Nuwun Sanget</span>
          </h2>

          <img
            src="/assets/photos/thanks-banner.png"
            alt="Momen Bahagia Faris & Vita"
            className="s-thanks-mobile-banner s-reveal"
            loading="lazy"
          />

          <div className="s-thanks-grid">
            <p className="s-thanks-text s-reveal">
              Terima kasih yang sebesar-besarnya atas doa restu, kebaikan hati, dan dukungan tulus
              yang senantiasa diberikan kepada kami berdua.
              <br />
              Momen-momen indah perjalanan kami telah kami rangkum di halaman Arsip Kenangan.
              <br />
              Silakan berkunjung kapan pun di waktu luang Anda.
            </p>

            <img
              src="/assets/photos/thanks-portrait.png"
              alt="Potret Ucapan Terima Kasih Faris & Vita"
              className="s-thanks-photo s-reveal s-reveal--fade"
              loading="lazy"
            />

            <Link href="/archive" className="s-thanks-link s-reveal">
              <span>Buka Arsip Kenangan &amp; Cerita Kami</span>
              <img
                src="/assets/archive-badge.png"
                alt="Lencana Arsip"
                className="s-thanks-badge"
              />
            </Link>
          </div>
        </div>

        <footer className="s-footer-copy">
          © 2027 Faris &amp; Vita.
        </footer>
      </section>
    </div>
  );
}
