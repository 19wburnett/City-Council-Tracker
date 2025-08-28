'use client'

import Link from 'next/link'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { User, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, supabase } = useSupabase()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Members', href: '/members' },
    { name: 'Meetings', href: '/meetings' },
    { name: 'Votes', href: '/votes' },
    { name: 'About', href: '/about' },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-boulder-600 to-primary-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">Boulder Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
