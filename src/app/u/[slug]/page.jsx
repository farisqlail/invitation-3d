import { redirect } from 'next/navigation';
import WeddingInvitation from '@/components/WeddingInvitation';
import { getAllGuests, getGuestBySlug } from '@/lib/guests';

export function generateStaticParams() {
  return getAllGuests().map((guest) => ({
    slug: guest.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guest = getGuestBySlug(slug);
  if (!guest) {
    return {};
  }

  const title = `Undangan Pernikahan Faris & Vita — ${guest.nama}`;
  const description = `${guest.nama}, kami mengundang Anda untuk menghadiri akad nikah & resepsi pernikahan Faris Rizqilail & Ardina Vita Rika Pratiwi pada hari Minggu, 10 Januari 2027 di Bangsal Pancasila UWKS Surabaya.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      images: [
        {
          url: '/assets/photos/hero-1.png',
          alt: `Undangan Pernikahan Faris & Vita untuk ${guest.nama}`,
        },
      ],
    },
  };
}

export default async function GuestInvitationPage({ params }) {
  const { slug } = await params;
  const guest = getGuestBySlug(slug);

  if (!guest) {
    redirect('/');
  }

  return <WeddingInvitation guest={guest} />;
}
