import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'PawPath Pro — Dog Walking Business Platform',
  description:
    'Professional dog walking software. GPS tracking, walk reports, client portal, and billing — all in one place.',
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
