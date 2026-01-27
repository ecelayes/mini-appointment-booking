import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  const token = event.cookies.get('auth_token');
  const path = event.url.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/auth'];
  const isPublic = publicRoutes.some(p => path.startsWith(p));

  if (!token && !isPublic && path !== '/') {
    // If trying to access protected route (except root) and not logged in
    throw redirect(303, '/login');
  }

  if (token && path === '/login') {
    // If logged in and trying to access login
    throw redirect(303, '/home');
  }

  // Root handler logic is handled here or in +page.server.ts,
  // but middleware can also force it.
  if (path === '/') {
    if (token) {
      throw redirect(303, '/home');
    } else {
      throw redirect(303, '/login');
    }
  }

  return await resolve(event);
}
