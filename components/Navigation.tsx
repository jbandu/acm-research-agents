'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleClickOutside(event: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = (session?.user as any)?.role === 'admin';

  // Don't show navigation on auth pages (check AFTER all hooks)
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-acm-brand to-acm-brand-dark bg-clip-text text-transparent">
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
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                >
                  🔬 New Query
                </Link>

                <Link
                  href="/workflows"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/workflows'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                >
                  📋 Workflows
                </Link>

                <Link
                  href="/history"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/history'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                >
                  📊 History
                </Link>

                <Link
                  href="/ontology"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/ontology'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                >
                  🕸️ Knowledge Graph
                </Link>

                <Link
                  href="/competitors"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/competitors'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                >
                  🗺️ Competitor Map
                </Link>

                {/* Admin Dropdown (only for admins) */}
                {isAdmin && (
                  <div className="relative" ref={adminRef}>
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        pathname?.startsWith('/admin')
                          ? 'text-acm-gold bg-amber-50'
                          : 'text-acm-text-default hover:text-acm-gold hover:bg-acm-gray-lightest'
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
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-acm-gold"
                            onClick={() => setIsAdminOpen(false)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">🗄️</span>
                              Database Migration
                            </span>
                          </Link>
                          <Link
                            href="/admin/intelligence"
                            className="block px-4 py-2 text-sm text-gray-900 hover:bg-amber-50 hover:text-acm-gold"
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
                <span className="text-sm text-acm-text-default flex items-center">
                  <span className="hidden sm:inline">{String(session.user?.name || session.user?.email || 'User')}</span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-acm-gold text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-sm text-acm-text-default hover:text-red-600 px-3 py-2 rounded-md font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm font-medium px-4 py-2 rounded-md bg-gradient-to-r from-acm-brand to-acm-brand-dark text-white hover:from-acm-brand-dark hover:to-acm-brand transition-all shadow-sm"
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
