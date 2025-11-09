'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isAdmin = (session?.user as any)?.role === 'admin';

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu (when clicking nav item or overlay)
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Don't show navigation on auth pages (check AFTER all hooks)
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Overlay - Only visible on mobile when menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side: Logo and Desktop Navigation */}
            <div className="flex">
              {/* Hamburger Menu Button - Mobile Only */}
              {status === 'authenticated' && (
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-acm-brand hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-acm-brand mr-2"
                  aria-label="Toggle menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  {/* Hamburger Icon */}
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isMobileMenuOpen ? (
                      // X icon when menu is open
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      // Hamburger icon when menu is closed
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}

              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-acm-brand to-acm-brand-dark bg-clip-text text-transparent">
                  ACM Research Agents
                </span>
              </Link>

              {/* Desktop Navigation - Hidden on mobile (< 768px) */}
              {status === 'authenticated' && (
                <div className="hidden md:ml-10 md:flex md:items-center md:space-x-1">
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
                            className="block px-4 py-2 text-sm text-black hover:bg-amber-50 hover:text-acm-gold"
                            onClick={() => setIsAdminOpen(false)}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">🗄️</span>
                              Database Migration
                            </span>
                          </Link>
                          <Link
                            href="/admin/intelligence"
                            className="block px-4 py-2 text-sm text-black hover:bg-amber-50 hover:text-acm-gold"
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

        {/* Mobile Slide-in Menu - Only visible on mobile (< 768px) */}
        {status === 'authenticated' && (
          <div
            className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Mobile Navigation Items */}
            <div className="flex flex-col h-full overflow-y-auto py-4">
              {/* Research Section Links */}
              <Link
                href="/query"
                onClick={closeMobileMenu}
                className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                  pathname === '/query'
                    ? 'text-acm-brand bg-acm-blue-lightest border-acm-brand'
                    : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest border-transparent'
                }`}
              >
                🔬 New Query
              </Link>

              <Link
                href="/workflows"
                onClick={closeMobileMenu}
                className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                  pathname === '/workflows'
                    ? 'text-acm-brand bg-acm-blue-lightest border-acm-brand'
                    : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest border-transparent'
                }`}
              >
                📋 Workflows
              </Link>

              <Link
                href="/history"
                onClick={closeMobileMenu}
                className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                  pathname === '/history'
                    ? 'text-acm-brand bg-acm-blue-lightest border-acm-brand'
                    : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest border-transparent'
                }`}
              >
                📊 History
              </Link>

              <Link
                href="/ontology"
                onClick={closeMobileMenu}
                className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                  pathname === '/ontology'
                    ? 'text-acm-brand bg-acm-blue-lightest border-acm-brand'
                    : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest border-transparent'
                }`}
              >
                🕸️ Knowledge Graph
              </Link>

              <Link
                href="/competitors"
                onClick={closeMobileMenu}
                className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                  pathname === '/competitors'
                    ? 'text-acm-brand bg-acm-blue-lightest border-acm-brand'
                    : 'text-acm-text-default hover:text-acm-brand hover:bg-acm-gray-lightest border-transparent'
                }`}
              >
                🗺️ Competitor Map
              </Link>

              {/* Admin Section (mobile) - Only for admins */}
              {isAdmin && (
                <>
                  <div className="px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-200 mt-4 pt-4">
                    Admin
                  </div>
                  <Link
                    href="/admin/migrate"
                    onClick={closeMobileMenu}
                    className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                      pathname === '/admin/migrate'
                        ? 'text-acm-gold bg-amber-50 border-acm-gold'
                        : 'text-acm-text-default hover:text-acm-gold hover:bg-amber-50 border-transparent'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">🗄️</span>
                      Database Migration
                    </span>
                  </Link>
                  <Link
                    href="/admin/intelligence"
                    onClick={closeMobileMenu}
                    className={`px-6 py-3 text-base font-medium transition-colors border-l-4 ${
                      pathname === '/admin/intelligence'
                        ? 'text-acm-gold bg-amber-50 border-acm-gold'
                        : 'text-acm-text-default hover:text-acm-gold hover:bg-amber-50 border-transparent'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">🤖</span>
                      Intelligence Dashboard
                    </span>
                  </Link>
                </>
              )}

              {/* User Info Section at bottom of mobile menu */}
              <div className="mt-auto px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700 mb-2">
                  {String(session?.user?.name || session?.user?.email || 'User')}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-acm-gold text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    signOut({ callbackUrl: '/auth/signin' });
                  }}
                  className="w-full text-left text-sm text-red-600 hover:text-red-800 font-medium py-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
