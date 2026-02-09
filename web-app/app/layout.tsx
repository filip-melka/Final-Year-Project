import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { FileContextProvider } from "@/context/file-context"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Polydoc",
  description: "A smart translation system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <FileContextProvider>
          <Navbar />
          {children}
          <Toaster />
        </FileContextProvider>
      </body>
    </html>
  )
}
