import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { IBM_Plex_Serif, Mona_Sans } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Transform your books into interactive AI conversations. Upload PDFs, and chat with your books using voice.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={`${ibmPlexSerif.variable} ${monaSans.variable} relative h-full font-sans antialiased`}>
      <body className='flex min-h-full flex-col w-full'>
        <ClerkProvider>
          <Navbar />
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  )
}
