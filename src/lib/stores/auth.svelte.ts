import { browser } from '$app/environment';
import { api, type User } from '$lib/services/api';
import { auth } from '$lib/services/firebase';
import { onIdTokenChanged } from 'firebase/auth';

class AuthStore {
  user = $state<User | null>(null);
  isAuthenticated = $derived(!!this.user);
  private initialized = false;

  constructor() {
    if (browser) {
      // Try to load from localStorage or cookie simulation if needed?
      // Actually, we rely on server-side hooks to handle sessions mostly for redirects,
      // but client-side state is good for UI.
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            this.user = parsed;
          } else {
            console.warn("Cleared invalid user data from localStorage");
            localStorage.removeItem('user');
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem('user');
        }
      }
    }
  }

  init() {
    if (!browser || this.initialized) return;
    this.initialized = true;

    onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();

          // Fetch fresh user data from backend to ensure we have latest profile (pic, etc)
          const user = await api.getMe(token);
          this.setUser(user, token);
        } catch (error) {
          console.error("Error refreshing token", error);
        }
      }
    });
  }

  setUser(user: User | null, token?: string) {
    this.user = user;
    if (browser) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (token) {
          localStorage.setItem('auth_token', token);
          document.cookie = `auth_token=${token}; path=/; max-age=86400`;
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
