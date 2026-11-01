'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ArchivePage() {
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

  return (
    <div className="s-page-root">
      {/* 1. Header Terbelah Dua */}
      <section className="s-archive-hero">
        <img
          src="/assets/wakusei-sm.svg"
          alt=""
          className="s-archive-hero__orbit s-reveal"
        />

        <div
          className="s-archive-hero__left"
          style={{
            backgroundImage: 'url(/assets/photos/vita-3.png)',
          }}
        >
          <h1 className="s-archive-hero__title s-reveal">Arsip Kenangan</h1>
        </div>

        <div className="s-archive-hero__right s-reveal delay-200">
          <Link href="/" className="s-archive-back">
            (← Kembali ke Atas)
          </Link>

          <div className="s-archive-greeting">
            <p>
              Terima kasih atas segala doa restu dan kehadiran Bapak/Ibu/Saudara/i
              <br />
              di hari pernikahan kami, Minggu, 10 Januari 2027
              <br />
              di Bangsal Pancasila UWKS Surabaya.
              <br />
              Dukungan keluarga besar Bapak Dadang Indarto &amp; Ibu Agustin Sulistyorini
              <br />
              serta Bapak Hariyanto &amp; Ibu Retno Soelistyowati
              <br />
              menjadikan hari bahagia ini kenangan yang tak terlupakan
              <br />
              sepanjang hidup kami berdua.
            </p>
            <p className="s-archive-aksara s-aksara">
              ꦩꦠꦸꦂ ꦤꦸꦮꦸꦤ꧀ ꦱꦔꦼꦠ꧀ ꦏꦠꦸꦂ ꦱꦼꦢꦪ ꦏꦸꦭꦮꦂꦒ꧈ ꦱꦤꦏ꧀ ꦏꦢꦁ꧈ ꦱꦲ ꦥꦫ ꦫꦮꦸꦃ ꦲꦶꦁꦏꦁ ꦱꦩ꧀ꦥꦸꦤ꧀ ꦏꦼꦥꦫꦼꦁ ꦫꦮꦸꦃ ꦥꦫꦶꦁ ꦧꦼꦂꦏꦃ ꦢꦺꦴꦔ ꦥꦩꦸꦗꦶ꧉ ꦱꦼꦢꦪ ꦱꦶꦃ ꦏꦠꦽꦱ꧀ꦤꦤ꧀ ꦥꦚ꧀ꦗꦼꦤꦼꦔꦤ꧀ ꦢꦢꦺꦴꦱ꧀ꦱꦏꦼꦤ꧀ ꦢꦶꦤ꧀ꦠꦼꦤ꧀ ꦩꦼꦤꦶꦏ ꦩ꧀ꦧꦺꦴꦠꦼꦤ꧀ ꦧꦝꦺ ꦏꦭꦭꦺꦏ꧀ꦲꦏꦼꦤ꧀ ꦱꦭꦩꦶꦤꦶꦥꦸꦤ꧀꧉
            </p>
          </div>
        </div>
      </section>

      {/* 2. Babak 1: Akad Nikah (Ijab Qobul) */}
      <div style={{ width: '100%', position: 'relative' }}>
        <div
          className="s-archive-chapter-hero"
          style={{
            backgroundImage: 'url(/assets/photos/archive-ceremony-hero.png)',
          }}
        >
          <h2 className="s-archive-chapter-title s-reveal">
            Akad Nikah
            <span className="s-archive-chapter-aksara s-aksara">ꦲꦶꦗꦧ꧀ꦏꦺꦴꦧꦸꦭ꧀</span>
          </h2>
          <span className="s-archive-chapter-time s-reveal delay-200">Pukul 08:00 WIB</span>
        </div>

        <div className="s-archive-gallery-wrap">
          <div className="s-archive-row">
            <img
              src="/assets/photos/archive-ceremony-1.png"
              alt="Momen Akad Nikah 1"
              className="s-reveal s-reveal--fade"
              style={{ width: '58%', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
            <img
              src="/assets/photos/vita-2.png"
              alt="Momen Akad Nikah 2"
              className="s-reveal s-reveal--fade delay-400"
              style={{ width: '36%', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>

          <div className="s-archive-row" style={{ alignItems: 'flex-start' }}>
            <img
              src="/assets/photos/vita-1.png"
              alt="Momen Akad Nikah 3"
              className="s-reveal s-reveal--fade"
              style={{ width: '32%', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
            <div
              style={{
                width: '62%',
                display: 'flex',
                flexDirection: 'column',
                gap: '64px',
              }}
            >
              <p className="s-archive-note s-reveal">
                Pagi hari yang cerah dan penuh kekhidmatan.
                <br />
                <br />
                Janji suci pernikahan diikrarkan di hadapan keluarga dan saksi tercinta,
                mengawali lembaran baru perjalanan kami sebagai sepasang suami dan istri.
              </p>
              <img
                src="/assets/photos/thanks-banner.png"
                alt="Momen Akad Nikah 4"
                className="s-reveal s-reveal--fade delay-400"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Babak 2: Resepsi Pernikahan (Pahargyan Temanten) */}
      <div style={{ width: '100%', position: 'relative' }}>
        <div
          className="s-archive-chapter-hero"
          style={{
            backgroundImage: 'url(/assets/photos/archive-reception-hero.png)',
          }}
        >
          <h2 className="s-archive-chapter-title s-reveal">
            Resepsi Pernikahan
            <span className="s-archive-chapter-aksara s-aksara">ꦥꦲꦂꦒꦾꦤ꧀ꦠꦼꦩꦤ꧀ꦠꦺꦤ꧀</span>
          </h2>
          <span className="s-archive-chapter-time s-reveal delay-200">Pukul 11:00 WIB</span>
        </div>

        <div className="s-archive-gallery-wrap">
          <div className="s-archive-row">
            <img
              src="/assets/photos/faris-2.png"
              alt="Momen Resepsi 1"
              className="s-reveal s-reveal--fade"
              style={{ width: '36%', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
            <img
              src="/assets/photos/archive-reception-1.png"
              alt="Momen Resepsi 2"
              className="s-reveal s-reveal--fade delay-400"
              style={{ width: '58%', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>

          <div className="s-archive-row" style={{ alignItems: 'flex-start' }}>
            <div
              style={{
                width: '56%',
                display: 'flex',
                flexDirection: 'column',
                gap: '64px',
              }}
            >
              <p className="s-archive-note s-reveal">
                Suasana hangat tempat kami berbincang dan berbagi senyum dengan setiap
                tamu yang hadir.
                <br />
                <br />
                <span className="s-aksara" style={{ display: 'block', fontSize: '15px', lineHeight: '2' }}>
                  ꦩꦠꦸꦂ ꦤꦸꦮꦸꦤ꧀ ꦱꦔꦼꦠ꧀ ꦱꦩ꧀ꦥꦸꦤ꧀ ꦫꦮꦸꦃ ꦥꦫꦶꦁ ꦢꦺꦴꦔ ꦥꦔꦺꦱ꧀ꦠꦸ ꦏꦒꦼꦩ꧀ ꦭꦩ꧀ꦥꦃ ꦧꦼꦧꦿꦪꦤ꧀ ꦲꦒꦼꦁ ꦏꦸꦭ ꦱꦏꦭꦶꦪꦤ꧀꧉
                </span>
              </p>
              <img
                src="/assets/photos/hero-2.png"
                alt="Momen Resepsi 3"
                className="s-reveal s-reveal--fade"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>

            <div
              style={{
                width: '38%',
                display: 'flex',
                flexDirection: 'column',
                gap: '48px',
              }}
            >
              <img
                src="/assets/photos/special-thumb.png"
                alt="Momen Resepsi 4"
                className="s-reveal s-reveal--fade delay-400"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                loading="lazy"
              />
              <img
                src="/assets/photos/hero-1.png"
                alt="Momen Resepsi 5"
                className="s-reveal s-reveal--fade delay-800"
                style={{ width: '85%', height: 'auto', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Penutup Kaki Halaman */}
      <footer className="s-archive-footer">
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '64px',
          }}
        >
          <p className="s-archive-note s-reveal">
            Pungkasaning atur, katur sedaya kulawarga ageng, kerabat, saha para sahabat
            ingkang tansah paring panyengkuyung:
            <br />
            <br />
            Mboten wonten tetembungan ingkang cekap kagem ngaturaken agenging panuwun kula.
            Mugi katentreman saha kabagyan tansah tumanduk dhumateng kita sedaya.
            <br />
            <br />
            Salam taklim kula sakaliyan,
            <br />
            Faris Rizqilail &amp; Ardina Vita Rika Pratiwi
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '32px',
            }}
          >
            <div>
              <Link
                href="/"
                className="s-archive-back"
                style={{ color: '#E1FF00', display: 'inline-block', marginBottom: '24px' }}
              >
                (← Kembali ke Halaman Utama)
              </Link>
              <div
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'var(--s-font-serif)',
                  fontSize: '18px',
                  fontWeight: 300,
                }}
              >
                © 2027 Faris &amp; Vita.
              </div>
            </div>

            <img
              src="/assets/photos/thanks-portrait.png"
              alt="Potret Penutup Faris & Vita"
              className="s-reveal s-reveal--fade"
              style={{ width: '220px', height: 'auto', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        </div>

        <img
          src="/assets/wakusei-lg.svg"
          alt=""
          style={{
            position: 'absolute',
            right: '-30px',
            bottom: '40px',
            width: '65%',
            height: 'auto',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      </footer>
    </div>
  );
}
