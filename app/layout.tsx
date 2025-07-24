/**
 * Root layout component that wraps all pages in the application.
 * This layout:
 * - Sets up Geist fonts (both Sans and Mono variants)
 * - Configures metadata like title and favicon
 * - Provides the basic HTML structure
 * - Applies font variables to the entire app
 */

import type { Metadata } from 'next';
import { instrumentSans } from './fonts';
import './styles/globals.css';

export const metadata: Metadata = {
  title: 'Parasight',
  description: 'A bio-horror snake game where you are the cure.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={instrumentSans.className}>{children}</body>
    </html>
  );
}
