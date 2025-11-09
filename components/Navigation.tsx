'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <>
      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isSidebarCollapsed && (
              <Link href="/" className="flex items-center">
                <span className="text-lg font-bold bg-gradient-to-r from-acm-brand to-acm-brand-dark bg-clip-text text-transparent">
                  ACM Research
                </span>
              </Link>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
                <Link
                  href="/query"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/query'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                  title="New Query"
                >
                  <span className="text-lg">🔬</span>
                  {!isSidebarCollapsed && <span className="ml-3">New Query</span>}
                </Link>

                <Link
                  href="/workflows"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/workflows'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                  title="Workflows"
                >
                  <span className="text-lg">📋</span>
                  {!isSidebarCollapsed && <span className="ml-3">Workflows</span>}
                </Link>

                <Link
                  href="/history"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/history'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                  title="History"
                >
                  <span className="text-lg">📊</span>
                  {!isSidebarCollapsed && <span className="ml-3">History</span>}
                </Link>

                <Link
                  href="/ontology"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/ontology'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                  title="Knowledge Graph"
                >
                  <span className="text-lg">🕸️</span>
                  {!isSidebarCollapsed && <span className="ml-3">Knowledge Graph</span>}
                </Link>

                <Link
                  href="/competitors"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/competitors'
                      ? 'text-acm-brand bg-acm-blue-lightest'
                      : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest'
                  }`}
                  title="Competitor Map"
                >
                  <span className="text-lg">🗺️</span>
                  {!isSidebarCollapsed && <span className="ml-3">Competitor Map</span>}
                </Link>

                {/* Admin Section (only for admins) */}
                {isAdmin && (
                  <div ref={adminRef}>
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname?.startsWith('/admin')
                          ? 'text-acm-gold bg-amber-50'
                          : 'text-acm-text-default hover:text-acm-gold hover:bg-acm-gray-lightest'
                      }`}
                      title="Admin"
                    >
                      <div className="flex items-center">
                        <span className="text-lg">⚙️</span>
                        {!isSidebarCollapsed && <span className="ml-3">Admin</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <svg
                          className={`h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {isAdminOpen && !isSidebarCollapsed && (
                      <div className="ml-6 mt-1 space-y-1">
                        <Link
                          href="/admin/migrate"
                          className="flex items-center px-3 py-2 rounded-md text-sm text-black hover:bg-amber-50 hover:text-acm-gold transition-colors"
                          onClick={() => setIsAdminOpen(false)}
                        >
                          <span className="mr-2">🗄️</span>
                          Database Migration
                        </Link>
                        <Link
                          href="/admin/intelligence"
                          className="flex items-center px-3 py-2 rounded-md text-sm text-black hover:bg-amber-50 hover:text-acm-gold transition-colors"
                          onClick={() => setIsAdminOpen(false)}
                        >
                          <span className="mr-2">🤖</span>
                          Intelligence Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* User Section at Bottom */}
          <div className="border-t border-gray-200 p-4">
            {status === 'loading' ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : status === 'authenticated' ? (
              <div className="space-y-2">
                {!isSidebarCollapsed && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {String(session.user?.name || session.user?.email || 'User')}
                      </p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-acm-gold text-xs rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className={`w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-acm-text-default hover:text-red-600 hover:bg-red-50 transition-colors ${
                    isSidebarCollapsed ? '' : ''
                  }`}
                  title="Sign Out"
                >
                  <span className="text-lg">🚪</span>
                  {!isSidebarCollapsed && <span className="ml-2">Sign Out</span>}
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center justify-center w-full px-4 py-2 rounded-md bg-gradient-to-r from-acm-brand to-acm-brand-dark text-white hover:from-acm-brand-dark hover:to-acm-brand transition-all shadow-sm text-sm font-medium"
              >
                {!isSidebarCollapsed ? 'Sign In' : '🔐'}
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer div to push content right */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`} />
    </>
  );
}
