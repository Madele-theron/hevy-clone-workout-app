import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import { WorkoutProvider } from "@/contexts/WorkoutContext";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IronPath",
  description: "Track your workouts",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-white`}>
        <ClerkProvider>
          <WorkoutProvider>
            <Header />
            <MainLayout>{children}</MainLayout>
          </WorkoutProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
