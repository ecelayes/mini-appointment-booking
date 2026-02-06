import { browser } from '$app/environment';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { auth } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  roleId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon?: string;
  color?: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  notes?: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  serviceName?: string;
}


export interface TimeRange {
  start: string;
  end: string;
}

export interface DaySchedule {
  ranges: TimeRange[];
  enabled: boolean;
}

export interface Provider {
  id: string;
  user_id?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  establishment_name?: string;
  full_name?: string;
}

export interface Schedule {
  id?: string;
  provider_id: string;
  type: 'global' | 'custom';
  days: Record<string, DaySchedule>;
  valid_from?: string;
  valid_to?: string;
}


export interface SlotsByPeriod {
  am: string[];
  pm: string[];
}


interface RawUser {
  uid?: string;
  id?: string;
  name?: string;
  email: string;
  picture?: string;
  roleId?: string;
}

interface RawService {
  id: string;
  title: string;
  description: string | Record<string, unknown>;
  duration_minutes: number;
  price?: number;
  cost?: number;
  icon_url?: string;
  color?: string;
  provider_id?: string;
}

interface RawAppointment {
  id: string;
  service_id: string;
  notes?: string;
  scheduled_at: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  service?: RawService;
}

interface RawProvider {
  id: string;
  user_id?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  establishment_name?: string;
  full_name?: string;
}

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:8083';

/**
 * Filter out time slots that have already passed for same-day bookings
 * @param slots - Array of time slots in HH:mm format
 * @param selectedDate - The date selected by the user (YYYY-MM-DD format)
 * @returns Filtered array of slots
 */
function filterPastSlots(slots: string[], selectedDate: string): string[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (selectedDate !== todayStr) {
    return slots;
  }

  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();

  return slots.filter(slot => {
    const [hour, minute] = slot.split(':').map(Number);
    return hour > currentHour || (hour === currentHour && minute > currentMinute);
  });
}

/**
 * Organize time slots into AM and PM periods
 * @param slots - Array of time slots in HH:mm format
 * @returns Object with am and pm arrays
 */
function organizeSlotsByPeriod(slots: string[]): SlotsByPeriod {
  const am: string[] = [];
  const pm: string[] = [];

  slots.forEach(slot => {
    const [hour] = slot.split(':').map(Number);
    if (hour < 12) {
      am.push(slot);
    } else {
      pm.push(slot);
    }
  });

  return { am, pm };
}

class ApiService {
  private getHeaders(): HeadersInit {
    if (browser) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
      }
    }
    return {
      'Content-Type': 'application/json'
    };
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (res.status === 401 && browser && auth.currentUser) {
      try {
        const newToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem('auth_token', newToken);

        res = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options.headers
          }
        });
      } catch (e) {
        console.error("Token refresh failed during retry", e);
      }
    }

    if (res.status === 401 && browser) {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = '/login';

      throw new Error('Session expired. Redirecting to login...');
    }

    return res;
  }

  async login(idToken: string): Promise<{ user: User, token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        role: 'user',
        settings: {}
      })
    });

    if (!res.ok) {
      throw new Error('Login failed: ' + res.statusText);
    }

    const data = await res.json() as RawUser;

    const user: User = {
      id: data.uid || data.id || '',
      name: data.name || 'User',
      email: data.email,
      picture: data.picture,
      roleId: data.roleId
    };

    return { user, token: idToken };
  }

  async getMe(token: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch user');

    const data = await res.json() as RawUser;
    return {
      id: data.uid || data.id || '',
      name: data.name || 'User',
      email: data.email,
      picture: data.picture,
      roleId: data.roleId
    };
  }

  async getServices(providerId?: string): Promise<Service[]> {
    let url = `${BASE_URL}/api/services`;
    if (providerId) {
      url += `?provider_id=${providerId}`;
    }
    const res = await this.fetchWithRetry(url);

    if (!res.ok) throw new Error('Failed to fetch services');

    const data = await res.json() as RawService[];
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: item.id,
      name: item.title || 'Untitled Service',
      description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
      duration: item.duration_minutes || 0,
      price: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 0),
      icon: item.icon_url,
      color: item.color
    }));
  }

  async createService(service: Partial<Service>, providerId?: string): Promise<Service> {
    const payload: Partial<RawService> = {
      title: service.name,
      description: service.description,
      duration_minutes: service.duration,
      price: service.price,
      icon_url: service.icon,
      color: service.color
    };

    if (providerId) {
      payload.provider_id = providerId;
    }

    const res = await this.fetchWithRetry(`${BASE_URL}/api/services`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create service');

    const item = await res.json() as RawService;
    return {
      id: item.id,
      name: item.title || 'Untitled Service',
      description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
      duration: item.duration_minutes || 0,
      price: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 0),
      icon: item.icon_url,
      color: item.color
    };
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const payload = {
      title: service.name,
      description: service.description,
      duration_minutes: service.duration,
      price: service.price,
      icon_url: service.icon,
      color: service.color
    };

    const res = await this.fetchWithRetry(`${BASE_URL}/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to update service');

    const item = await res.json() as RawService;
    return {
      id: item.id,
      name: item.title || 'Untitled Service',
      description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
      duration: item.duration_minutes || 0,
      price: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 0),
      icon: item.icon_url,
      color: item.color
    };
  }

  async deleteService(id: string): Promise<void> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/services/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete service');
  }

  async getService(id: string): Promise<Service | undefined> {
    try {
      const res = await this.fetchWithRetry(`${BASE_URL}/api/services/${id}`);
      if (!res.ok) return undefined;
      const item = await res.json() as RawService;

      return {
        id: item.id,
        name: item.title || 'Untitled Service',
        description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
        duration: item.duration_minutes || 0,
        price: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 0),
        icon: item.icon_url,
        color: item.color
      };
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  async getAppointments(options?: { type?: 'upcoming' | 'past', limit?: number, offset?: number, providerId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.providerId) params.append('provider_id', options.providerId);

    const queryString = params.toString();
    const url = `${BASE_URL}/api/appointments${queryString ? `?${queryString}` : ''}`;

    const [res, services] = await Promise.all([
      this.fetchWithRetry(url),
      this.getServices(options?.providerId).catch(() => [])
    ]);

    if (!res.ok) throw new Error('Failed to fetch appointments');

    const data = await res.json() as RawAppointment[];
    if (!Array.isArray(data)) return [];

    const serviceMap = new Map(services.map(s => [s.id, s]));

    let appointments = data.map((item) => {
      const service = serviceMap.get(item.service_id);
      const name = (item as any).service_name || service?.name;

      return {
        id: item.id,
        serviceId: item.service_id,
        serviceName: name,
        notes: item.notes,
        date: item.scheduled_at,
        status: item.status || 'confirmed'
      };
    });

    if (options) {
      const now = new Date();

      if (options.type) {
        appointments = appointments.filter((a: Appointment) => {
          const apptDate = new Date(a.date);
          const isPast = apptDate < now;
          if (options.type === 'upcoming') {
            return !isPast && a.status !== 'completed' && a.status !== 'cancelled';
          } else {
            return isPast || a.status === 'completed';
          }
        });
      }

      appointments.sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return options.type === 'upcoming' ? dateA - dateB : dateB - dateA;
      });

      if (options.offset !== undefined && options.limit !== undefined) {
        if (data.length > options.limit) {
          appointments = appointments.slice(options.offset, options.offset + options.limit);
        }
      }
    }

    return appointments;
  }

  async getAvailableSlots(serviceId: string, date: string): Promise<SlotsByPeriod> {
    const offset = -new Date().getTimezoneOffset();
    const res = await this.fetchWithRetry(`${BASE_URL}/api/slots?service=${serviceId}&date=${date}&timezone_offset=${offset}`);

    if (!res.ok) {
      return { am: [], pm: [] };
    }

    const data = await res.json();
    const slots = Array.isArray(data) ? data : [];

    const filteredSlots = filterPastSlots(slots, date);

    return organizeSlotsByPeriod(filteredSlots);
  }

  async getAppointment(id: string): Promise<Appointment> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/appointments/${id}`);

    if (!res.ok) throw new Error('Failed to fetch appointment');

    const item = await res.json();
    return {
      id: item.id,
      serviceId: item.service,
      notes: item.notes,
      date: item.scheduled_at,
      status: item.status || 'confirmed'
    };
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const payload = {
      scheduled_at: appointment.date,
      status: 'confirmed',
      service_id: appointment.serviceId,
      notes: 'Created via frontend'
    };

    const res = await this.fetchWithRetry(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create appointment');

    const created = await res.json() as RawAppointment;

    return {
      id: created.id,
      serviceId: created.service_id,
      notes: created.notes,
      date: created.scheduled_at,
      status: created.status
    };
  }

  async cancelAppointment(id: string): Promise<void> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    if (!res.ok) throw new Error('Failed to cancel appointment');
  }

  async getFirstProvider(): Promise<RawProvider | null> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/providers?limit=1`);

    if (!res.ok) throw new Error('Failed to fetch provider');

    const data = await res.json() as RawProvider[];
    return data && data.length > 0 ? data[0] : null;
  }

  async getProviderByUserId(userId: string): Promise<RawProvider | null> {
    // Note: Backend must support ?user_id=... filtering on providers endpoint
    // OR we use the current 'List' which scopes to logged in user.
    // If usage is "get MY provider", then list behavior is correct.
    const res = await this.fetchWithRetry(`${BASE_URL}/api/providers?limit=1`);
    if (!res.ok) throw new Error('Failed to fetch provider');
    const data = await res.json() as RawProvider[];
    return data && data.length > 0 ? data[0] : null;
  }

  async updateProvider(id: string, data: Partial<RawProvider>): Promise<void> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to update provider');
  }

  async createProvider(provider: Partial<Provider>): Promise<Provider> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/providers`, {
      method: 'POST',
      body: JSON.stringify(provider)
    });

    if (!res.ok) throw new Error('Failed to create provider');

    const created = await res.json() as RawProvider;

    return {
      id: created.id,
      phone: created.phone,
      address: created.address,
      avatar_url: created.avatar_url,
      establishment_name: created.establishment_name
    };
  }

  async getMyProvider(): Promise<Provider | null> {
    const provider = await this.getFirstProvider();
    if (!provider) return null;
    return provider as Provider;
  }

  async getProviderSchedule(providerId: string, type: 'global' | 'custom' = 'global'): Promise<Schedule | null> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/schedules?provider_id=${providerId}&type=${type}`);
    if (!res.ok) throw new Error('Failed to fetch schedule');

    const data = await res.json();
    if (!data || !data.days) return null;

    return data as Schedule;
  }

  async updateProviderSchedule(schedule: Schedule): Promise<void> {
    const res = await this.fetchWithRetry(`${BASE_URL}/api/schedules`, {
      method: 'PUT',
      body: JSON.stringify(schedule)
    });

    if (!res.ok) throw new Error('Failed to update schedule');
  }

  async getPublicServices(providerId: string): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/public/providers/${providerId}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    const data = await res.json() as RawService[];
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: item.id,
      name: item.title || 'Untitled Service',
      description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
      duration: item.duration_minutes || 0,
      price: item.price !== undefined ? item.price : (item.cost !== undefined ? item.cost : 0),
      icon: item.icon_url,
      color: item.color
    }));
  }

  private slotsCache: Map<string, { data: SlotsByPeriod, timestamp: number }> = new Map();

  async getPublicAvailableSlots(providerId: string, serviceId: string, date: string): Promise<SlotsByPeriod> {
    const cacheKey = `${providerId}-${serviceId}-${date}`;
    const cached = this.slotsCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp < 60000)) {
      return cached.data;
    }

    const offset = -new Date().getTimezoneOffset();
    const res = await fetch(`${BASE_URL}/public/providers/${providerId}/slots?service=${serviceId}&date=${date}&timezone_offset=${offset}`);
    if (!res.ok) return { am: [], pm: [] };
    const data = await res.json();
    const slots = Array.isArray(data) ? data : [];
    const filteredSlots = filterPastSlots(slots, date);
    const result = organizeSlotsByPeriod(filteredSlots);

    this.slotsCache.set(cacheKey, { data: result, timestamp: now });

    return result;
  }

  async createPublicAppointment(providerId: string, appointment: Partial<Appointment> & { clientName?: string, clientPhone?: string }): Promise<Appointment> {
    const notes = `Client: ${appointment.clientName || 'N/A'}, Phone: ${appointment.clientPhone || 'N/A'}. ${appointment.notes || ''}`;

    const payload = {
      scheduled_at: appointment.date,
      status: 'confirmed',
      service_id: appointment.serviceId,
      notes: notes
    };

    const res = await fetch(`${BASE_URL}/public/providers/${providerId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create appointment');
    }

    const created = await res.json() as RawAppointment;
    return {
      id: created.id,
      serviceId: created.service_id,
      notes: created.notes,
      date: created.scheduled_at,
      status: created.status
    };
  }
}

export const api = new ApiService();
