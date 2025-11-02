'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const intelligenceRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleClickOutside(event: MouseEvent) {
      if (intelligenceRef.current && !intelligenceRef.current.contains(event.target as Node)) {
        setIsIntelligenceOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ACM Research Agents
              </span>
            </Link>

            {status === 'authenticated' && (
              <div className="ml-10 flex items-center space-x-1">
                {/* Research Section */}
                <Link
                  href="/query"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/query'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  🔬 New Query
                </Link>

                <Link
                  href="/workflows"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/workflows'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  📋 Workflows
                </Link>

                <Link
                  href="/history"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/history'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  📊 History
                </Link>

                {/* Intelligence Dropdown */}
                <div className="relative" ref={intelligenceRef}>
                  <button
                    onClick={() => setIsIntelligenceOpen(!isIntelligenceOpen)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                      pathname?.startsWith('/ontology') || pathname?.startsWith('/competitors')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    🧠 Intelligence
                    <svg className={`ml-1 h-4 w-4 transition-transform ${isIntelligenceOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isIntelligenceOpen && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          href="/ontology"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setIsIntelligenceOpen(false)}
                        >
                          <span className="flex items-center">
                            <span className="mr-2">🕸️</span>
                            Knowledge Graph
                          </span>
                        </Link>
                        <Link
                          href="/competitors"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setIsIntelligenceOpen(false)}
                        >
                          <span className="flex items-center">
                            <span className="mr-2">🗺️</span>
                            Competitor Map
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Dropdown (only for admins) */}
                {isAdmin && (
                  <div className="relative" ref={adminRef}>
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        pathname?.startsWith('/admin')
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                      }`}
                    >
                      ⚙️ Admin
                      <svg className={`ml-1 h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isAdminOpen && (
                      <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                          <Link
                            href="/admin/migrate"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                            onClick={() => setIsAdminOpen(false)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">🗄️</span>
                              Database Migration
                            </span>
                          </Link>
                          <Link
                            href="/admin/intelligence"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                            onClick={() => setIsAdminOpen(false)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">🤖</span>
                              Intelligence Dashboard
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : status === 'authenticated' ? (
              <>
                <span className="text-sm text-gray-700 flex items-center">
                  <span className="hidden sm:inline">{String(session.user?.name || session.user?.email || 'User')}</span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-sm text-gray-700 hover:text-red-600 px-3 py-2 rounded-md font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm font-medium px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
