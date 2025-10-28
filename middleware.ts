export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/',
    '/query/:path*',
    '/workflows/:path*',
    '/history/:path*',
    '/api/query/:path*',
    '/api/workflows/:path*',
    '/api/history/:path*',
  ],
};
