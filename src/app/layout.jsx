import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Faris & Vita — The Wedding Walkthrough',
  description: 'Undangan Pernikahan 3D Garden Walkthrough Faris & Vita',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  viewportFit: 'cover',
  themeColor: '#2c499c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${cormorantGaramond.variable} ${plusJakartaSans.variable}`}>
      <body className="bg-[#243b82] text-white font-sans antialiased selection:bg-[#ffe2a8] selection:text-[#213c8b]">
        {children}
      </body>
    </html>
  );
}
