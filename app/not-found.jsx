'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-whitesmoke px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Main Content Container */}
        <div className="text-center">
          {/* Error Code */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-black mb-2" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              404
            </h1>
            <div className="h-1 w-20 bg-black mx-auto"></div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl font-semibold text-black mb-4">
            Page Not Found
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-8 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          {/* Action Button */}
          <div className="mb-12">
            <Link href="/">
              <Button variant="primary" size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="mt-16 flex justify-center">
          <div className="w-32 h-32 rounded-full border-2 border-gray-300 opacity-30 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Lost?</span>
          </div>
        </div>
      </div>
    </div>
  )
}
