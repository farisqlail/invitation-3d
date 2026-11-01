import './globals.css';
import { Cormorant_Garamond, Noto_Serif_JP, Jost } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-mincho',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Faris & Vita — Undangan Pernikahan | 10 Januari 2027',
  description:
    'Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara akad nikah dan resepsi pernikahan Faris Rizqilail & Ardina Vita Rika Pratiwi pada hari Minggu, 10 Januari 2027 di Bangsal Pancasila UWKS Surabaya.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#E1FF00',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${cormorant.variable} ${notoSerifJP.variable} ${jost.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Javanese:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
