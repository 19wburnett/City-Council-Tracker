'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'

interface ProfileImageProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProfileImage({ src, alt, size = 'md', className = '' }: ProfileImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-30 h-30'
  }

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const imageSizes = {
    sm: 64,
    md: 96,
    lg: 120
  }

  // If no src or image failed to load, show placeholder
  if (!src || imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md ${className}`}>
        <User className={`${iconSizes[size]} text-gray-500`} />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-lg">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={`object-cover shadow-md ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 ${className}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
      />
    </div>
  )
}
