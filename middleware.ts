import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
});

export const config = {
  matcher: [
    '/query/:path*',
    '/workflows/:path*',
    '/history/:path*',
    '/api/query/:path*',
    '/api/workflows/:path*',
    '/api/history/:path*',
  ],
};
