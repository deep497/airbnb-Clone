import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Airbnb Clone – Find Your Perfect Stay",
  description:
    "Browse unique homes, cabins, villas, and more around the world. Book your dream stay on Airbnb Clone.",
  keywords: ["airbnb", "travel", "accommodation", "vacation rental", "booking"],
  openGraph: {
    title: "Airbnb Clone – Find Your Perfect Stay",
    description: "Browse unique homes and experiences around the world.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Inline script to prevent screen flash/FOUC before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-200 antialiased">
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main>{children}</main>
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "12px",
                  background: "#222",
                  color: "#fff",
                  fontSize: "14px",
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
