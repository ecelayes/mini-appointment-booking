import { api, type Provider, type Service, type Appointment, type Schedule, type DaySchedule } from '$lib/services/api';

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleRule {
  days: string[];
  slots: TimeSlot[];
}

class BusinessStore {
  provider = $state<Provider | null>(null);
  services = $state<Service[]>([]);
  globalSchedule = $state<Schedule | null>(null);
  // Derived value for schedule rules often used in UI could be here, or computed in components.
  // Keeping logic simple in store for now.

  appointments = $state<Appointment[]>([]);
  loading = $state(false);

  // Initial load of business setup (Provider, Services, Schedule)
  async loadBusinessData() {
    this.loading = true;
    try {
      this.provider = await api.getMyProvider();

      if (this.provider) {
        const [fetchedServices, schedule] = await Promise.all([
          api.getServices(),
          api.getProviderSchedule(this.provider.id, "global")
        ]);
        this.services = fetchedServices;
        this.globalSchedule = schedule;
      } else {
        this.services = [];
        this.globalSchedule = null;
      }
    } catch (e) {
      console.error("Error loading business data", e);
      // On error, maybe we shouldn't clear everything, but depends on severity.
    } finally {
      this.loading = false;
    }
  }

  // Refresh just services (e.g. after adding one) - triggers UI updates
  async refreshServices() {
    if (!this.provider) return; // Can't have services without provider generally, or api handles it
    try {
      this.services = await api.getServices();
    } catch (e) {
      console.error(e);
    }
  }

  // Refresh just global schedule (e.g. after editing in GlobalScheduleView)
  async refreshGlobalSchedule() {
    if (!this.provider) return;
    try {
      this.globalSchedule = await api.getProviderSchedule(this.provider.id, "global");
    } catch (e) {
      console.error("Error refreshing global schedule", e);
    }
  }

  async createService(data: Partial<Service>) {
    if (!this.provider) throw new Error("No provider set");
    const item = await api.createService(data, this.provider.id);
    this.services = [...this.services, item];
    return item;
  }

  async updateService(id: string, data: Partial<Service>) {
    const item = await api.updateService(id, data);
    this.services = this.services.map(s => s.id === id ? item : s);
    return item;
  }

  async deleteService(id: string) {
    await api.deleteService(id);
    this.services = this.services.filter(s => s.id !== id);
  }

  async createProvider(data: Partial<Provider>) {
    const item = await api.createProvider(data);
    this.provider = item;
    // Optionally refresh services/schedule if side effects exist
    return item;
  }

  async updateProvider(id: string, data: any) {
    await api.updateProvider(id, data);
    // Refresh provider to get latest state
    this.provider = await api.getMyProvider();
  }
}

export const businessState = new BusinessStore();
