
import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google'; // Use standard Google Fonts
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

// Use Inter for sans-serif, assign it to the --font-geist-sans variable
const geistSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Use Roboto_Mono for monospace, assign it to the --font-geist-mono variable
const geistMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Code Weaver', // Updated title
  description: 'AI-powered code editor', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Apply dark class globally */}
      {/* Apply the font variables */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster for potential notifications */}
      </body>
    </html>
  );
}
