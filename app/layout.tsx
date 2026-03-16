import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Viral Vision OS',
  description: 'Company operating system for Viral Vision — Sales, Onboarding, Production, Publishing, Ads',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body suppressHydrationWarning>
        {(process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') && (
          <Script
            src="https://snippet.meticulous.ai/v1/meticulous.js"
            data-recording-token="5KQmcxT9O4PB7MZb4CYxpMZaWhxrsWHY3xQniYpZ"
            data-is-production-environment="false"
          />
        )}
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
