import type { Metadata } from "next";
import { AssistLoopWidget } from "@/components/AssistLoopWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agency OS",
  description: "Internal operating system",
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
