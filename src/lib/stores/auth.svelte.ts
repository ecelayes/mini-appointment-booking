import { browser } from '$app/environment';
import type { User } from '$lib/services/api';

class AuthStore {
  user = $state<User | null>(null);
  isAuthenticated = $derived(!!this.user);

  constructor() {
    if (browser) {
      // Try to load from localStorage or cookie simulation if needed?
      // Actually, we rely on server-side hooks to handle sessions mostly for redirects,
      // but client-side state is good for UI.
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    }
  }

  setUser(user: User | null, token?: string) {
    this.user = user;
    if (browser) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (token) {
          localStorage.setItem('auth_token', token);
          document.cookie = `auth_token=${token}; path=/; max-age=86400`; // 1 day
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }

  logout() {
    this.setUser(null);
    if (browser) {
      window.location.href = '/login';
    }
  }
}

export const authState = new AuthStore();
