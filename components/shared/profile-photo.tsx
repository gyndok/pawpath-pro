'use client'

/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

function initialsFromName(name?: string | null) {
  if (!name) return '?'

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) return '?'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function ProfilePhoto({
  src,
  alt,
  name,
  className,
  fallbackClassName,
  fallback,
}: {
  src?: string | null
  alt: string
  name?: string | null
  className?: string
  fallbackClassName?: string
  fallback?: ReactNode
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-[#fff4e8] text-sm font-semibold text-[#9b4d1c]',
        fallbackClassName,
        className
      )}
      aria-label={alt}
    >
      {fallback ?? initialsFromName(name)}
    </div>
  )
}
