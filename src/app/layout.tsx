import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distric Internet',
  description: 'Platform manajemen layanan WiFi lokal Distric Net.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
