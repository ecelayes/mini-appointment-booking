import { browser } from '$app/environment';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

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
  duration: number; // in minutes
  price: number;
  icon?: string; // e.g. "dental", "cut"
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string; // ISO datestring
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  providerName?: string;
  location?: string;
}

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:8083';

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
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-token'
    };
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

    const data = await res.json();
    
    const user: User = {
        id: data.uid,
        name: data.name || 'User', 
        email: data.email,
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
    
    const data = await res.json();
    return {
        id: data.id,
        name: data.name || 'User',
        email: data.email,
        picture: data.picture,
        roleId: data.roleId
    };
  }

  async getServices(): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/api/services`, {
        headers: this.getHeaders()
    });
    
    if (!res.ok) throw new Error('Failed to fetch services');
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
        id: item.id,
        name: item.title || 'Untitled Service',
        description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
        duration: item.duration_minutes || 0,
        price: 0,
        icon: item.icon_url
    }));
  }

  async getService(id: string): Promise<Service | undefined> {
    try {
        const res = await fetch(`${BASE_URL}/api/services/${id}`, {
            headers: this.getHeaders()
        });
        if (!res.ok) return undefined;
        const item = await res.json();
        
        return {
            id: item.id,
            name: item.title || 'Untitled Service',
            description: typeof item.description === 'string' ? item.description : JSON.stringify(item.description || ''),
            duration: item.duration_minutes || 0,
            price: 0,
            icon: item.icon_url
        };
    } catch (e) {
        console.error(e);
        return undefined;
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
        headers: this.getHeaders()
    });
    
    if (!res.ok) throw new Error('Failed to fetch appointments');
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
        id: item.id,
        serviceId: item.service, 
        serviceName: 'Service', 
        date: item.scheduled_at,
        status: item.status || 'confirmed',
        providerName: item.provider,
        location: 'Online'
    }));
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const payload = {
        scheduled_at: appointment.date,
        status: 'confirmed',
        service: appointment.serviceId,
        provider: 'default-provider',
        notes: 'Created via frontend'
    };

    const res = await fetch(`${BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create appointment');

    const created = await res.json();
    
    return {
        id: created.id,
        serviceId: created.service,
        serviceName: appointment.serviceName || 'Service',
        date: created.scheduled_at,
        status: created.status,
        providerName: created.provider,
        location: 'Online'
    };
  }
}

export const api = new ApiService();
