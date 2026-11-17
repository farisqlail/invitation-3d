import ArchiveView from '@/components/ArchiveView';
import { getGuestBySlug } from '@/lib/guests';

export default async function ArchivePage({ searchParams }) {
  const params = await searchParams;
  const rawSlug = typeof params?.u === 'string' ? params.u : '';
  const guest = rawSlug ? getGuestBySlug(rawSlug) : null;

  return <ArchiveView guest={guest} />;
}
