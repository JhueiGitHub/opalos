import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ReactQueryClientProvider from "@/react-query";

export const metadata: Metadata = {
  title: "Orion",
  description: "The Age Of Architects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ReactQueryClientProvider>{children}</ReactQueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
