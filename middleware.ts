import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Authentication disabled - all routes are publicly accessible
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// No routes are protected - middleware passes through all requests
export const config = {
  matcher: [],
};
