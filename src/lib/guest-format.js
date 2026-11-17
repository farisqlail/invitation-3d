export const DEFAULT_WA_TEMPLATE = [
  'Bismillahirrahmanirrahim.',
  'Kepada Yth. {nama},',
  '',
  'Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara akad nikah & resepsi pernikahan kami:',
  '',
  'Faris Rizqilail & Ardina Vita Rika Pratiwi',
  'Hari/Tanggal: Minggu, 10 Januari 2027',
  'Tempat: Bangsal Pancasila UWKS Surabaya',
  '',
  'Informasi lengkap & petunjuk arah dapat dibuka melalui tautan undangan berikut:',
  '{link}',
  '',
  'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
  '',
  'Terima kasih.',
  'Wassalamualaikum Wr. Wb.',
].join('\n');

const NAMA_HEADER_ALIASES = new Set([
  'nama',
  'name',
  'nama tamu',
  'nama_tamu',
  'tamu',
  'guest',
  'guest_name',
]);

export function cleanGuestText(value, maxLength = 100) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function slugifyGuestName(text, maxLen = 60) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
    .replace(/-+$/g, '');
}

export function parseCsvRows(content) {
  const text = String(content || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

/**
 * Extract `{ slug, nama }` entries from spreadsheet rows (supports 1-column with or without header).
 */
export function extractGuestsFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { guests: [], deduplicatedCount: 0 };
  }

  const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
  let namaColIndex = firstRow.findIndex((cell) =>
    NAMA_HEADER_ALIASES.has(cleanGuestText(cell).toLowerCase())
  );

  let startRow = 1;
  if (namaColIndex === -1) {
    // Support single-column sheets without a header row (names start from row 1).
    const nonEmptyCols = firstRow.filter((cell) => cleanGuestText(cell) !== '');
    if (nonEmptyCols.length <= 1) {
      namaColIndex = 0;
      startRow = 0;
    } else {
      throw new Error(
        'Kolom "nama" tidak ditemukan di baris header. Gunakan 1 kolom bernama "nama".'
      );
    }
  }

  const usedSlugs = new Set();
  const guests = [];
  let deduplicatedCount = 0;

  for (let i = startRow; i < rows.length; i += 1) {
    const row = Array.isArray(rows[i]) ? rows[i] : [];
    const nama = cleanGuestText(row[namaColIndex]);
    if (!nama) continue;

    const baseSlug = slugifyGuestName(nama) || `tamu-${guests.length + 1}`;
    let finalSlug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
      deduplicatedCount += 1;
    }
    usedSlugs.add(finalSlug);

    guests.push({ slug: finalSlug, nama });
  }

  return { guests, deduplicatedCount };
}

/**
 * Build the locked invitation URL for a guest slug.
 */
export function buildWeddingInvitationLink(origin, slug) {
  const base = (origin || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/u/${encodeURIComponent(slug)}`;
}

/**
 * Format a shareable WhatsApp invitation message from guest name and link.
 */
export function buildWhatsAppMessage(guest, link, template = DEFAULT_WA_TEMPLATE) {
  const nama = guest?.nama || '';
  return template
    .replaceAll('{nama}', nama)
    .replaceAll('{link}', link);
}

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildGuestLinksCsv(guests, origin, template = DEFAULT_WA_TEMPLATE) {
  const header = ['Nama', 'Link Undangan', 'Link Kirim WA', 'Pesan WA'];
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...guests.map((guest) => {
      const link = buildWeddingInvitationLink(origin, guest.slug);
      const message = buildWhatsAppMessage(guest, link, template);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      return [guest.nama, link, waUrl, message].map(escapeCsvCell).join(',');
    }),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
