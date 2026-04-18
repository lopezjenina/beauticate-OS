import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEAUTICATE.",
  description: "Agency operating system — www.beauticate.com",
};

const IS_PROD = process.env.NODE_ENV === "production";

// Anti-debugging: triggers a debugger loop if DevTools is open in production.
// This makes it significantly harder to step through or read client-side logic.
const antiDebugScript = `
(function(){
  if (typeof window === 'undefined') return;
  var threshold = 160;
  function check() {
    var w = window.outerWidth - window.innerWidth > threshold;
    var h = window.outerHeight - window.innerHeight > threshold;
    if (w || h) { (function l(){debugger; l();})(); }
  }
  setInterval(check, 1500);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {IS_PROD && (
          <script
            id="anti-debug"
            dangerouslySetInnerHTML={{ __html: antiDebugScript }}
          />
        )}
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
