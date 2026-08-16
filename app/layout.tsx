import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari, Rozha_One } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

const rozhaOne = Rozha_One({
  subsets: ['devanagari', 'latin'],
  weight: ['400'],
  variable: '--font-rozha',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'डिजिटल पावती पुस्तक | Digital Pavti Book',
  description: 'गणेशोत्सव व सार्वजनिक उत्सव देणगी / वर्गणी व्यवस्थापन प्रणाली | Digital Donation & Collection Management System for Ganpati Mandals',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr" className={`${inter.variable} ${notoSansDevanagari.variable} ${rozhaOne.variable}`}>
      <body className="min-h-screen bg-[#FFFDF9] text-stone-800 antialiased font-sans flex flex-col selection:bg-orange-100 selection:text-orange-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
