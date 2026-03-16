import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'PawPath Pro — Dog Walking Business Platform',
  description:
    'Professional dog walking software. GPS tracking, walk reports, client portal, and billing — all in one place.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'PawPath Pro — Dog Walking Business Platform',
    description: 'Professional dog walking software. GPS tracking, walk reports, client portal, and billing — all in one place.',
    images: [{ url: '/assets/social/og-image.png', width: 1920, height: 1080 }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        style={
          {
            '--font-geist-sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            '--font-geist-mono': '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
          } as CSSProperties
        }
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
