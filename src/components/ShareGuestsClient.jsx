'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { readSheet } from 'read-excel-file/browser';
import {
  DEFAULT_WA_TEMPLATE,
  buildGuestLinksCsv,
  buildWeddingInvitationLink,
  buildWhatsAppMessage,
  extractGuestsFromRows,
  parseCsvRows,
} from '@/lib/guest-format';

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ShareGuestsClient({
  guests: initialGuests = [],
  defaultOrigin = 'http://localhost:3000',
}) {
  const [guests, setGuests] = useState(initialGuests);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [origin, setOrigin] = useState(defaultOrigin);
  const [search, setSearch] = useState('');
  const [template, setTemplate] = useState(DEFAULT_WA_TEMPLATE);
  const [copiedKey, setCopiedKey] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guests;
    return guests.filter(
      (guest) =>
        guest.nama.toLowerCase().includes(query) ||
        guest.slug.toLowerCase().includes(query)
    );
  }, [guests, search]);

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? '' : prev));
      }, 1800);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts; ignore silently.
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    try {
      const lowerName = file.name.toLowerCase();
      let rows;
      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        rows = parseCsvRows(text);
      } else if (lowerName.endsWith('.xlsx')) {
        rows = await readSheet(file);
      } else {
        throw new Error('Format file harus .xlsx atau .csv.');
      }

      const { guests: parsedGuests } = extractGuestsFromRows(rows);
      if (parsedGuests.length === 0) {
        throw new Error('Tidak ada nama tamu ditemukan di file tersebut.');
      }

      setGuests(parsedGuests);
      setUploadedFileName(file.name);
      setSearch('');
    } catch (error) {
      setUploadError(error?.message || 'Gagal membaca file Excel/CSV.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadJson = () => {
    downloadFile(
      `${JSON.stringify(guests, null, 2)}\n`,
      'guests.json',
      'application/json;charset=utf-8'
    );
  };

  const handleDownloadCsv = () => {
    const csv = buildGuestLinksCsv(guests, origin, template);
    downloadFile(csv, 'guests-links.csv', 'text/csv;charset=utf-8');
  };

  const handleResetToSaved = () => {
    setGuests(initialGuests);
    setUploadedFileName('');
    setUploadError('');
  };

  return (
    <main className="s-kirim-page">
      <div className="s-kirim-container">
        <header className="s-kirim-header">
          <div>
            <p className="s-kirim-eyebrow">Pengelola Link Undangan</p>
            <h1 className="s-kirim-title">Sebar Undangan Faris &amp; Vita</h1>
            <p className="s-kirim-sub">
              Total tamu: <strong>{guests.length}</strong>
              {uploadedFileName ? ` (dari ${uploadedFileName})` : ''}.
            </p>
          </div>
          <Link href="/" className="s-kirim-btn s-kirim-btn--ghost">
            ← Lihat Undangan Umum
          </Link>
        </header>

        <section className="s-kirim-upload" aria-label="Upload File Excel Daftar Nama">
          <div className="s-kirim-upload__top">
            <div>
              <h2>Upload Excel Daftar Nama Tamu</h2>
              <p>
                Cukup 1 kolom <code>nama</code> (format <code>.xlsx</code> atau <code>.csv</code>). Contoh: <code>examples/guests-template.csv</code>.
              </p>
            </div>
            <label className="s-kirim-btn s-kirim-btn--primary" htmlFor="kirim-excel-input">
              Pilih File Excel / CSV
            </label>
            <input
              ref={fileInputRef}
              id="kirim-excel-input"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {uploadError && <p className="s-kirim-error">{uploadError}</p>}

          {guests.length > 0 && (
            <div className="s-kirim-upload__actions">
              <button
                type="button"
                className="s-kirim-btn s-kirim-btn--link"
                onClick={handleDownloadJson}
              >
                Download guests.json
              </button>
              <button
                type="button"
                className="s-kirim-btn s-kirim-btn--ghost"
                onClick={handleDownloadCsv}
              >
                Download CSV Link
              </button>
              {uploadedFileName && (
                <button
                  type="button"
                  className="s-kirim-btn s-kirim-btn--ghost"
                  onClick={handleResetToSaved}
                >
                  Reset Data Tersimpan
                </button>
              )}
            </div>
          )}

          {uploadedFileName && (
            <p className="s-kirim-hint">
              Agar tautan <code>/u/...</code> aktif saat dibuka tamu, simpan hasil <strong>Download guests.json</strong> ke <code>src/data/guests.json</code> lalu build/deploy ulang (atau jalankan <code>npm run import:guests</code>).
            </p>
          )}
        </section>

        {guests.length === 0 ? (
          <section className="s-kirim-empty">
            <h2>Daftar Tamu Masih Kosong</h2>
            <p>
              Upload file Excel (<code>.xlsx</code> / <code>.csv</code>) berisi 1 kolom <code>nama</code> di atas, atau jalankan lewat terminal:
            </p>
            <pre className="s-kirim-code">
              {`npm run import:guests -- ./examples/guests-template.csv --url=${origin}`}
            </pre>
          </section>
        ) : (
          <>
            <section className="s-kirim-controls">
              <div className="s-kirim-row">
                <div className="s-kirim-field" style={{ flex: 1 }}>
                  <label htmlFor="kirim-origin">Domain Website Undangan</label>
                  <input
                    id="kirim-origin"
                    type="url"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="https://domain-anda.com"
                  />
                </div>

                <div className="s-kirim-field" style={{ flex: 1 }}>
                  <label htmlFor="kirim-search">Cari Nama Tamu</label>
                  <input
                    id="kirim-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ketik nama tamu..."
                  />
                </div>
              </div>

              <div className="s-kirim-field">
                <div className="s-kirim-label-bar">
                  <label htmlFor="kirim-template">
                    Template Pesan WhatsApp (variabel: <code>{'{nama}'}</code>, <code>{'{link}'}</code>)
                  </label>
                  <button
                    type="button"
                    className="s-kirim-reset"
                    onClick={() => setTemplate(DEFAULT_WA_TEMPLATE)}
                  >
                    Reset Default
                  </button>
                </div>
                <textarea
                  id="kirim-template"
                  rows={5}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                />
              </div>
            </section>

            <section className="s-kirim-list" aria-label="Daftar Tautan Tamu">
              {filteredGuests.length === 0 ? (
                <p className="s-kirim-no-match">Tidak ada tamu yang cocok dengan pencarian.</p>
              ) : (
                filteredGuests.map((guest) => {
                  const link = buildWeddingInvitationLink(origin, guest.slug);
                  const message = buildWhatsAppMessage(guest, link, template);
                  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  const linkKey = `link:${guest.slug}`;
                  const msgKey = `msg:${guest.slug}`;

                  return (
                    <article key={guest.slug} className="s-kirim-card">
                      <div className="s-kirim-card__info">
                        <h2 className="s-kirim-card__name">{guest.nama}</h2>
                        <p className="s-kirim-card__url">{link}</p>
                      </div>

                      <div className="s-kirim-card__actions">
                        <button
                          type="button"
                          className="s-kirim-btn s-kirim-btn--ghost"
                          onClick={() => handleCopy(link, linkKey)}
                        >
                          {copiedKey === linkKey ? 'Link Tersalin' : 'Salin Link'}
                        </button>
                        <button
                          type="button"
                          className="s-kirim-btn s-kirim-btn--ghost"
                          onClick={() => handleCopy(message, msgKey)}
                        >
                          {copiedKey === msgKey ? 'Pesan Tersalin' : 'Salin Pesan'}
                        </button>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="s-kirim-btn s-kirim-btn--primary"
                        >
                          Kirim WA
                        </a>
                        <Link
                          href={`/u/${encodeURIComponent(guest.slug)}`}
                          target="_blank"
                          className="s-kirim-btn s-kirim-btn--link"
                        >
                          Buka ↗
                        </Link>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
