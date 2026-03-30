import type { Metadata } from "next";
import { AssistLoopWidget } from "@/components/AssistLoopWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viral Vision OS",
  description: "Agency operating system — www.viralvisionmk.com",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AssistLoopWidget />
      </body>
    </html>
  );
}
