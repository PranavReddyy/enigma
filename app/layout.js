import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Enigma",
  description: "The Official Computer Science club of Mahindra University.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          fontFamily:
            '"MS Sans Serif", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          backgroundColor: "#000000",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}