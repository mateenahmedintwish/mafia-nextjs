import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MAFIA | Trust No One",
    template: "%s | MAFIA"
  },
  description: "The ultimate real-time social deduction game. Play Mafia (Werewolf) online with friends without a moderator. Features automatic role assignment, day/night phases, and seamless mobile gameplay.",
  keywords: ["Mafia", "Werewolf", "Social Deduction", "Online Game", "Multiplayer", "Party Game", "Browser Game", "Next.js"],
  authors: [{ name: "Mafia Team" }],
  creator: "Mafia Team",
  publisher: "Mafia Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MAFIA - The Social Deduction Game",
    description: "Trust No One. Suspect Everyone. Join the ultimate online Mafia experience.",
    url: "https://mafia.toolteeno.com", // Placeholder or dynamic if user had one
    siteName: "MAFIA",
    images: [
      {
        url: "/mafia.jpg", // We don't have this but it's good practice to define
        width: 1200,
        height: 630,
        alt: "Mafia Game Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAFIA - Trust No One",
    description: "Play custom Mafia games online. No moderator required.",
    creator: "@mafia_game", // Placeholder
  },
  icons: {
    icon: "/role-game.png",
    shortcut: "/role-game.png",
    apple: "/role-game.png",
  },
  metadataBase: new URL("https://mafia.toolteeno.com"),
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
