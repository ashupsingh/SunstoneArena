import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import NavbarWrapper from '@/components/NavbarWrapper';

export const metadata: Metadata = {
  title: 'SyntaxError — Smart Campus Management System',
  description: 'Real-time campus management for ADTU — food court crowds, class schedules, bus timings, and more.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col relative overflow-x-hidden" suppressHydrationWarning>
        {/* Light background accents */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[120px] animate-blob" />
          <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full bg-violet-200/20 blur-[100px] animate-blob-delay" />
          <div className="absolute bottom-[-10%] left-[30%] w-[350px] h-[350px] rounded-full bg-blue-200/20 blur-[100px] animate-blob-delay-2" />
        </div>

        <AuthProvider>
          <NavbarWrapper />
          <main className="flex-grow w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
