import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Nashik Organic Express - Fresh Pesticide-Free Vegetables',
  description:
    'Order farm-fresh organic vegetables online in Nashik. Directly sourced from certified organic farmers in Niphad & Sinnar. Doorstep delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-cream-100 dark:bg-slate-950 flex flex-col min-h-screen text-slate-800 dark:text-slate-100 antialiased selection:bg-organic-200 selection:text-organic-900">
        <Providers>
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
