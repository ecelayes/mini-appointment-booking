<script lang="ts">
  import { onMount } from "svelte";
  import { api, type Service } from "$lib/services/api";
  import {
    Briefcase,
    Scissors,
    Flower2,
    Heart,
    Dumbbell,
    PenTool,
    Zap,
    Coffee,
    Music,
    Camera,
    Car,
    House,
    Clock,
    Pencil,
    Trash2,
    Plus,
    Building2,
  } from "lucide-svelte";
  import { page } from '$app/stores';
  import Card from "$lib/components/ui/Card.svelte";
  import ServiceModal from "$lib/components/ui/ServiceModal.svelte";
  import ConfirmModal from "$lib/components/ui/ConfirmModal.svelte";
  // BusinessHoursModal removal - it is now inside GlobalScheduleView
  import GlobalScheduleView from "$lib/components/ui/GlobalScheduleView.svelte";
  import { authState } from "$lib/stores/auth.svelte";
  import type { Provider, Schedule, DaySchedule } from "$lib/services/api";

  import { businessState } from "$lib/stores/business.svelte";

  interface TimeSlot {
    start: string;
    end: string;
  }

  interface ScheduleRule {
    days: string[];
    slots: TimeSlot[];
  }

  // Use store state
  let services = $derived(businessState.services);
  let globalSchedule = $derived(businessState.globalSchedule);
  let provider = $derived(businessState.provider);
  let loading = $derived(businessState.loading);
  
  // Local derived state for UI
  let globalScheduleRules = $derived(
      globalSchedule && globalSchedule.days 
        ? convertScheduleToRules(globalSchedule.days) 
        : []
  );

  let hasActiveSchedule = $derived(
      globalScheduleRules.some(rule => rule.slots.length > 0)
  );

  let isModalOpen = $state(false);
  let editingService = $state<Service | null>(null);
  let deleteModalOpen = $state(false);
  let serviceToDelete = $state<Service | null>(null);

  const dayLabels: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  // View state
  let view = $state<"menu" | "global_schedule">("menu");
  let activeTab = $state<"services" | "hours">("services");

  // Helper to get diverse colors for icons based on index or id (simple rotation)
  const iconMap: Record<string, any> = {
    briefcase: Briefcase,
    scissors: Scissors,
    flower: Flower2,
    medical: Heart,
    gym: Dumbbell,
    pencil: PenTool,
    zap: Zap,
    coffee: Coffee,
    music: Music,
    camera: Camera,
    car: Car,
    house: House,
  };

  const colorPresets: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
    green: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
    orange: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
    pink: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400" },
    red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
    gray: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  };

  const getServiceStyles = (color?: string) => {
    return colorPresets[color || "blue"] || colorPresets["blue"];
  };

  onMount(() => {
    businessState.loadBusinessData();
    
    // Check for tab param
    const tab = $page.url.searchParams.get('tab');
    if (tab === 'hours') {
        activeTab = 'hours';
    }
  });

  function convertScheduleToRules(
    schedule: Record<string, DaySchedule>,
  ): ScheduleRule[] {
    const groups: Record<string, { days: string[]; slots: TimeSlot[] }> = {};
    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    // Add implicit "Closed" days to the list if we want to show them?
    // The design shows "Sun CLOSED".
    // Our existing logic in GlobalScheduleView only groups *enabled* days.
    // Let's iterate all days.

    for (const day of days) {
      const daySchedule = schedule[day];
      let slots: TimeSlot[] = [];

      if (
        daySchedule &&
        daySchedule.enabled &&
        daySchedule.ranges &&
        daySchedule.ranges.length > 0
      ) {
        slots = daySchedule.ranges.map((r) => ({ start: r.start, end: r.end }));
      }
      // Key including "closed" status (empty slots)
      const key = JSON.stringify(slots);

      if (!groups[key]) {
        groups[key] = { days: [], slots };
      }
      groups[key].days.push(day);
    }

    return Object.values(groups).map((g) => ({
      days: g.days,
      slots: g.slots,
    }));
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${m} ${ampm}`;
  }

  function getDayLabel(days: string[]) {
    const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const sorted = [...days].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    );

    if (days.length === 5 && sorted.join(",") === "mon,tue,wed,thu,fri")
      return "Mon - Fri";
    if (days.length === 2 && sorted.join(",") === "sat,sun") return "Sat - Sun";

    return sorted.map((d) => dayLabels[d]).join(", ");
  }

  function openCreateModal() {
    editingService = null;
    isModalOpen = true;
  }

  function openEditModal(service: Service) {
    editingService = service;
    isModalOpen = true;
  }

  async function handleSave(serviceData: Partial<Service>) {
    if (editingService) {
      await businessState.updateService(editingService.id, serviceData);
    } else {
      await businessState.createService(serviceData);
    }
  }

  function handleDelete(service: Service) {
    serviceToDelete = service;
    deleteModalOpen = true;
  }

  async function confirmDelete() {
    if (!serviceToDelete) return;

    try {
      await businessState.deleteService(serviceToDelete.id);
      deleteModalOpen = false;
      serviceToDelete = null;
    } catch (e) {
      console.error(e);
      alert("Failed to delete service");
      deleteModalOpen = false;
      serviceToDelete = null;
    }
  }

  // No longer needed here
</script>

<ServiceModal
  isOpen={isModalOpen}
  service={editingService}
  onClose={() => (isModalOpen = false)}
  onSave={handleSave}
/>

<ConfirmModal
  isOpen={deleteModalOpen}
  title="Delete Service?"
  message={serviceToDelete ? `Are you sure you want to delete "${serviceToDelete.name}"? This action cannot be undone.` : ''}
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => { deleteModalOpen = false; serviceToDelete = null; }}
/>


{#if view === "global_schedule"}
  <GlobalScheduleView
    onBack={async () => {
      view = "menu";
      // Refresh data when returning from edit
      await businessState.loadBusinessData();
    }}
  />
{:else}
  <div class="bg-gray-50 dark:bg-gray-950 px-6 pt-8 min-h-full pb-20">
    <header class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Manage</h1>
    </header>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6 relative">
      <button
        class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab ===
        'services'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-500'}"
        onclick={() => (activeTab = "services")}
      >
        Services
        {#if activeTab === "services"}
          <div
            class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
          ></div>
        {/if}
      </button>
      <button
        class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab ===
        'hours'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-500'}"
        onclick={() => (activeTab = "hours")}
      >
        Business Hours
        {#if activeTab === "hours"}
          <div
            class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
          ></div>
        {/if}
      </button>
    </div>

    <div class="flex flex-col gap-6">
      {#if activeTab === "services"}
        <!-- Add New Service Button -->
        {#if provider}
          <button
            class="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
            onclick={openCreateModal}
          >
            <Plus size={20} class="stroke-[3]" />
            <span>Add New Service</span>
          </button>
        {:else}
          <section class="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-2xl p-4 flex items-start gap-4 mb-6">
              <div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                  <Building2 size={24} />
              </div>
              <div class="flex-1">
                  <h3 class="font-bold text-gray-900 dark:text-white text-sm mb-1">Configure Business Profile</h3>
                  <p class="text-xs text-purple-800/80 dark:text-purple-300 leading-relaxed mb-3">
                       You need to upload your business details to start accepting bookings.
                  </p>
                  <a href="/profile?action=edit_business" class="inline-flex items-center text-xs font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      Setup Profile
                  </a>
              </div>
          </section>
        {/if}

        {#if loading}
          <div class="space-y-4">
            <div
              class="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full animate-pulse"
            ></div>
            <div
              class="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full animate-pulse"
            ></div>
            <div
              class="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full animate-pulse"
            ></div>
          </div>
        {:else}
          {#if provider}
          <div>
            <h2
              class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3"
            >
              Your Services ({services.length})
            </h2>

            {#if services.length === 0}
              <div class="text-center py-10 text-gray-400 text-sm">
                No services found. Add one to get started.
              </div>
            {:else}
              <div class="space-y-3">
                {#each services as service, i}
                  <!-- Card Component -->
                  <Card
                    class="flex items-start p-4 bg-white dark:bg-gray-900 !rounded-2xl !shadow-sm !border-none"
                  >
                    <!-- Icon / Image Placeholder -->
                    {@const styles = getServiceStyles(service.color)}
                    {@const IconComponent =
                      iconMap[service.icon || "briefcase"] || Briefcase}

                    <div
                      class={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 mr-4 ${styles.bg} ${styles.text}`}
                    >
                      <IconComponent size={22} />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0 pt-0.5">
                      <h3
                        class="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1"
                      >
                        {service.name}
                      </h3>

                      <!-- Duration and Price Row -->
                      <div class="flex items-center gap-3 text-sm">
                        {#if service.duration}
                          <div class="flex items-center text-gray-500 gap-1">
                            <Clock size={14} class="mt-px" />
                            <span>{service.duration} min</span>
                          </div>
                          <span class="text-gray-300">•</span>
                        {/if}
                        <div class="font-bold text-blue-500 dark:text-blue-400">
                          ${(service.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 ml-2 self-center">
                      <button
                        class="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        onclick={() => openEditModal(service)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        onclick={() => handleDelete(service)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                {/each}
              </div>
            {/if}
          </div>
          {/if}
        {/if}
      {:else if activeTab === "hours"}
        <div class="grid grid-cols-1 gap-4">
          {#if hasActiveSchedule}
            <!-- Global Schedule Summary Card -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              onclick={() => (view = "global_schedule")}
            >
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white text-lg">
                    Global Schedule
                  </h3>
                  <p class="text-xs text-gray-400 mt-1">Updated recently</p>
                </div>
                <span
                  class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full tracking-wide"
                >
                  ACTIVE
                </span>
              </div>

              <div class="space-y-4">
                {#each globalScheduleRules as rule}
                  <div class="flex justify-between items-start text-sm">
                    <span class="font-medium text-gray-600 dark:text-gray-400 w-24"
                      >{getDayLabel(rule.days)}</span
                    >
                    <div class="font-bold text-gray-900 dark:text-white text-right">
                      {#if rule.slots.length === 0}
                        <span class="text-red-500">CLOSED</span>
                      {:else}
                        {#each rule.slots as slot}
                          <div class="block">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                        {/each}
                      {/if}
                    </div>
                  </div>
                  <div class="h-px bg-gray-50 dark:bg-gray-800 last:hidden"></div>
                {/each}
              </div>
            </div>
          {:else}
            <button
              class="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/10 transition-all group bg-white dark:bg-gray-900"
              onclick={() => (view = "global_schedule")}
            >
              <div
                class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Plus size={24} />
              </div>
              <div class="text-center">
                <h3 class="font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Add Global Schedule
                </h3>
                <p class="text-sm text-gray-400">
                  Create your standard weekly hours
                </p>
              </div>
            </button>
          {/if}

          <button
            class="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/10 transition-all group bg-white dark:bg-gray-900"
            onclick={() => alert("Custom schedule feature coming soon")}
          >
            <div
              class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <Plus size={24} />
            </div>
            <div class="text-center">
              <h3 class="font-bold text-blue-600 dark:text-blue-400 mb-1">Add Custom Schedule</h3>
              <p class="text-sm text-gray-400">
                Set specific dates or holiday schedules
              </p>
            </div>
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
