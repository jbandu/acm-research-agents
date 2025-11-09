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

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Overlay - Only visible on mobile when menu is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Palantir-style Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-dark-surface border-b border-dark-border z-50 backdrop-blur-sm bg-opacity-95">
        <div className="h-full flex items-center justify-between px-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-dark-text-muted hover:text-accent-blue hover:bg-dark-elevated focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
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

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">AR</span>
              </div>
              <span className="text-lg font-semibold text-dark-text tracking-tight">
                ACM Research Agents
              </span>
            </Link>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center space-x-4">
            {status === 'authenticated' && (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-dark-text-muted hidden sm:block">
                  {String(session.user?.name || session.user?.email || 'User')}
                </div>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-accent-yellow/10 text-accent-yellow text-xs rounded-md border border-accent-yellow/30 font-medium uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Palantir-style Left Sidebar Navigation */}
      {/* Mobile: Slide in from left when open, Desktop: Always visible */}
      <aside className={`fixed left-0 top-14 bottom-0 w-56 bg-dark-elevated border-r border-dark-border z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <nav className="flex flex-col h-full py-4">
          <div className="flex-1 space-y-1 px-3 overflow-y-auto">
            <Link
              href="/query"
              onClick={closeMobileMenu}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                pathname === '/query'
                  ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/30'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>New Query</span>
            </Link>

            <Link
              href="/workflows"
              onClick={closeMobileMenu}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                pathname === '/workflows'
                  ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/30'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Workflows</span>
            </Link>

            <Link
              href="/history"
              onClick={closeMobileMenu}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                pathname === '/history'
                  ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/30'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </Link>

            <Link
              href="/ontology"
              onClick={closeMobileMenu}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                pathname === '/ontology'
                  ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/30'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Knowledge Graph</span>
            </Link>

            <Link
              href="/competitors"
              onClick={closeMobileMenu}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                pathname === '/competitors'
                  ? 'text-accent-blue bg-accent-blue/10 border border-accent-blue/30'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Competitor Map</span>
            </Link>

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="h-px bg-dark-border my-2"></div>
                <div ref={adminRef}>
                  <button
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      pathname?.startsWith('/admin')
                        ? 'text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/30'
                        : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface border border-transparent'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Admin</span>
                    </div>
                    <svg
                      className={`h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isAdminOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      <Link
                        href="/admin/migrate"
                        className="flex items-center px-3 py-2 rounded-md text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-surface transition-colors"
                        onClick={() => {
                          setIsAdminOpen(false);
                          closeMobileMenu();
                        }}
                      >
                        Database Migration
                      </Link>
                      <Link
                        href="/admin/intelligence"
                        className="flex items-center px-3 py-2 rounded-md text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-surface transition-colors"
                        onClick={() => {
                          setIsAdminOpen(false);
                          closeMobileMenu();
                        }}
                      >
                        Intelligence Dashboard
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center px-3 py-2 rounded-md text-sm text-dark-text-muted hover:text-dark-text hover:bg-dark-surface transition-colors"
                        onClick={() => {
                          setIsAdminOpen(false);
                          closeMobileMenu();
                        }}
                      >
                        Provider Settings
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-dark-border pt-3 px-3 space-y-1">
            {status === 'authenticated' ? (
              <button
                onClick={() => {
                  closeMobileMenu();
                  signOut({ callbackUrl: '/auth/signin' });
                }}
                className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-dark-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all duration-150 border border-transparent hover:border-accent-red/30"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-3 py-2.5 rounded-md text-sm font-medium text-white bg-gradient-to-br from-accent-blue to-accent-blue-dim hover:from-accent-blue-dim hover:to-accent-blue transition-all border border-accent-blue/30"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content Spacer - Prevents overlap with fixed navigation */}
      {/* Mobile: Only top padding, Desktop: Top + left padding */}
      <div className="pt-14 md:pl-56">
        {/* This spacer ensures content doesn't overlap with fixed navigation */}
      </div>
    </>
  );
}
