import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Providers } from "./providers";
import EmotionCacheProvider from '@/lib/emotion/EmotionCacheProvider';

export const metadata: Metadata = {
  title: "CoopNest - Cooperative Management System",
  description: "A sophisticated cooperative management system with role-based access control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <EmotionCacheProvider>
          <Providers>{children}</Providers>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
