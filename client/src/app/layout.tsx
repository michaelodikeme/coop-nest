import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Providers } from "./providers";
// import EmotionCacheProvider from '@/lib/emotion/EmotionCacheProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

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
      <head>
        {/* Favicon links */}
        <link rel="icon" href="/coopnest_favicon.svg" type="image/svg+xml" />
        {/* <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" /> */}
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {/*<EmotionCacheProvider>*/}
        <AppRouterCacheProvider options={{ key: 'mui' }}>
          <Providers>{children}</Providers>
        {/*</EmotionCacheProvider>*/}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
