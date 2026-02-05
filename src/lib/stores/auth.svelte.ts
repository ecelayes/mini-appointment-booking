import { browser } from '$app/environment';
import { api, type User } from '$lib/services/api';
import { auth } from '$lib/services/firebase';
import { onIdTokenChanged } from 'firebase/auth';

class AuthStore {
  user = $state<User | null>(null);
  isAuthenticated = $derived(!!this.user);
  loggingIn = $state(false);
  private initialized = false;

  constructor() {
    if (browser) {
      // We rely on the token. User data is fetched on init().
    }
  }

  init() {
    if (!browser || this.initialized) return;
    this.initialized = true;

    onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we are in the middle of a manual login flow, do NOT fetch me automatically.
        // The manual flow will handle the backend creation/fetch to avoid 404s.
        if (this.loggingIn) return;

        try {
          const token = await firebaseUser.getIdToken();

          // Fetch fresh user data from backend to ensure we have latest profile (pic, etc)
          const user = await api.getMe(token);
          this.setUser(user, token);
        } catch (error) {
          console.error("Error refreshing token", error);
        }
      } else {
        this.setUser(null);
      }
    });
  }

  setUser(user: User | null, token?: string) {
    this.user = user;
    if (browser) {
      if (user && token) {
        localStorage.setItem('auth_token', token);
        document.cookie = `auth_token=${token}; path=/; max-age=86400`;
      } else if (!user) {
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
