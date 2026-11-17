import guestsData from '@/data/guests.json';
import {
  DEFAULT_WA_TEMPLATE,
  buildWeddingInvitationLink,
  buildWhatsAppMessage,
} from '@/lib/guest-format';

export {
  DEFAULT_WA_TEMPLATE,
  buildWeddingInvitationLink,
  buildWhatsAppMessage,
};

const guestsList = Array.isArray(guestsData) ? guestsData : [];

const guestBySlugMap = new Map();
for (const entry of guestsList) {
  if (entry && typeof entry.slug === 'string' && typeof entry.nama === 'string') {
    guestBySlugMap.set(entry.slug.trim().toLowerCase(), {
      slug: entry.slug.trim(),
      nama: entry.nama.trim(),
    });
  }
}

/**
 * Return all registered guests loaded from src/data/guests.json.
 */
export function getAllGuests() {
  return Array.from(guestBySlugMap.values());
}

/**
 * Look up a guest by URL slug. Returns null when slug is not registered.
 */
export function getGuestBySlug(rawSlug) {
  if (typeof rawSlug !== 'string' || !rawSlug.trim()) return null;
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    decoded = rawSlug;
  }
  return guestBySlugMap.get(decoded.trim().toLowerCase()) ?? null;
}

/**
 * Resolve configured site origin URL with safe fallback for metadataBase and link export.
 */
export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const normalized = candidate.trim();
    if (!normalized) continue;
    try {
      return new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
    } catch {
      // Try next fallback candidate when an env value is malformed.
    }
  }

  return new URL('http://localhost:3000');
}
