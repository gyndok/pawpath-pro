import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    // Tell Turbopack this project's root is its own directory, not the parent monorepo
    root: path.resolve(__dirname),
  },
}

export default nextConfig
