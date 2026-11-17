import ShareGuestsClient from '@/components/ShareGuestsClient';
import { getAllGuests, getSiteUrl } from '@/lib/guests';

export const metadata = {
  title: 'Sebar Link Undangan — Faris & Vita',
  robots: {
    index: false,
    follow: false,
  },
};

export default function KirimPage() {
  const guests = getAllGuests();
  const defaultOrigin = getSiteUrl().origin;

  return <ShareGuestsClient guests={guests} defaultOrigin={defaultOrigin} />;
}
