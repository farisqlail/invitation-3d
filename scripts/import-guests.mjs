import fs from 'node:fs/promises';
import path from 'node:path';
import { readSheet } from 'read-excel-file/node';
import writeXlsxFile from 'write-excel-file/node';
import {
  buildGuestLinksCsv,
  buildWeddingInvitationLink,
  buildWhatsAppMessage,
  extractGuestsFromRows,
  parseCsvRows,
} from '../src/lib/guest-format.js';

const ROOT_DIR = process.cwd();
const DEFAULT_INPUT_CANDIDATES = [
  path.join(ROOT_DIR, 'data', 'guests.xlsx'),
  path.join(ROOT_DIR, 'data', 'guests.csv'),
];
const OUTPUT_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'guests.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'data');

function parseArgs(argv) {
  let inputFile = null;
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';

  for (const arg of argv) {
    if (arg.startsWith('--url=')) {
      siteUrl = arg.slice('--url='.length).trim() || siteUrl;
    } else if (!arg.startsWith('-')) {
      inputFile = arg;
    }
  }

  return { inputFile, siteUrl: siteUrl.replace(/\/+$/, '') };
}

async function resolveInputFile(explicitPath) {
  if (explicitPath) {
    const resolved = path.resolve(ROOT_DIR, explicitPath);
    await fs.access(resolved);
    return resolved;
  }

  for (const candidate of DEFAULT_INPUT_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next default candidate path.
    }
  }

  throw new Error(
    'File daftar tamu tidak ditemukan. Letakkan di data/guests.xlsx (atau data/guests.csv) atau jalankan: npm run import:guests -- ./path/file.xlsx'
  );
}

async function readRowsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const raw = await fs.readFile(filePath, 'utf8');
    return parseCsvRows(raw);
  }
  if (ext === '.xlsx') {
    return readSheet(filePath);
  }
  throw new Error(`Format file "${ext}" belum didukung. Gunakan .xlsx atau .csv.`);
}

async function main() {
  const { inputFile, siteUrl } = parseArgs(process.argv.slice(2));
  const resolvedInput = await resolveInputFile(inputFile);
  const rows = await readRowsFromFile(resolvedInput);
  const { guests, deduplicatedCount } = extractGuestsFromRows(rows);

  if (guests.length === 0) {
    throw new Error('Tidak ada nama tamu valid yang ditemukan untuk di-import.');
  }

  await fs.mkdir(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await fs.writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(guests, null, 2)}\n`, 'utf8');

  const outputCsvPath = path.join(OUTPUT_DIR, 'guests-links.csv');
  await fs.writeFile(outputCsvPath, buildGuestLinksCsv(guests, siteUrl), 'utf8');

  const outputXlsxPath = path.join(OUTPUT_DIR, 'guests-links.xlsx');
  const xlsxData = [
    [
      { value: 'Nama', fontWeight: 'bold' },
      { value: 'Link Undangan', fontWeight: 'bold' },
      { value: 'Link Kirim WA', fontWeight: 'bold' },
      { value: 'Pesan WA', fontWeight: 'bold' },
    ],
    ...guests.map((guest) => {
      const link = buildWeddingInvitationLink(siteUrl, guest.slug);
      const waMessage = buildWhatsAppMessage(guest, link);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
      return [
        { type: String, value: guest.nama },
        { type: String, value: link },
        { type: String, value: waUrl },
        { type: String, value: waMessage },
      ];
    }),
  ];
  await writeXlsxFile(xlsxData, {
    columns: [
      { width: 28 },
      { width: 42 },
      { width: 42 },
      { width: 60 },
    ],
  }).toFile(outputXlsxPath);

  console.log(`Imported ${guests.length} guests from ${path.relative(ROOT_DIR, resolvedInput)}`);
  if (deduplicatedCount > 0) {
    console.log(`Deduplicated ${deduplicatedCount} duplicate slug(s).`);
  }
  console.log(`Public guest list: ${path.relative(ROOT_DIR, OUTPUT_JSON_PATH)}`);
  console.log(`Shareable CSV:     ${path.relative(ROOT_DIR, outputCsvPath)}`);
  console.log(`Shareable XLSX:    ${path.relative(ROOT_DIR, outputXlsxPath)}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
