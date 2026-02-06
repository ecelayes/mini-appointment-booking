z<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronLeft, Plus, Clock, Pencil, Trash2 } from 'lucide-svelte';
  import BusinessHoursModal from './BusinessHoursModal.svelte';
  import { api, type Provider, type DaySchedule, type Schedule } from '$lib/services/api';
  import { authState } from '$lib/stores/auth.svelte';
  import { businessState } from '$lib/stores/business.svelte';

  interface TimeSlot {
    start: string;
    end: string;
  }

  interface ScheduleRule {
    id: string;
    days: string[];
    slots: TimeSlot[];
  }

  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();

  let rules = $state<ScheduleRule[]>([]);
  let provider = $state<Provider | null>(null);
  let currentSchedule = $state<Schedule | null>(null);
  let isModalOpen = $state(false);
  let editingRule = $state<ScheduleRule | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const dayLabels: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
  };

  onMount(async () => {
    try {
      loading = true;
      provider = await api.getMyProvider();
      
      if (provider) {
        // Fetch separate schedule
        currentSchedule = await api.getProviderSchedule(provider.id, 'global');
        if (currentSchedule && currentSchedule.days) {
             rules = convertScheduleToRules(currentSchedule.days);
        }
      } else {
        // Provider not found - user needs to set up business details first
        error = "Please set up your Business Details in the Profile page to manage your schedule.";
      }
    } catch (e) {
      console.error("Failed to load provider schedule", e);
      error = "Failed to load schedule.";
    } finally {
        loading = false;
    }
  });

  function convertScheduleToRules(schedule: Record<string, DaySchedule>): ScheduleRule[] {
    const groups: Record<string, { days: string[], slots: TimeSlot[] }> = {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    for (const day of days) {
      const daySchedule = schedule[day];
      if (daySchedule && daySchedule.enabled && daySchedule.ranges && daySchedule.ranges.length > 0) {
        const slots = daySchedule.ranges.map(r => ({ start: r.start, end: r.end }));
        const key = JSON.stringify(slots);

        if (!groups[key]) {
          groups[key] = { days: [], slots };
        }
        groups[key].days.push(day);
      }
    }

    return Object.values(groups).map(g => ({
      id: crypto.randomUUID(),
      days: g.days,
      slots: g.slots
    }));
  }

  async function saveToBackend(currentRules: ScheduleRule[]) {
    if (!provider) {
        alert("Cannot save: No provider profile loaded.");
        return;
    }

    const newDays: Record<string, DaySchedule> = {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    // Initialize all days as disabled
    days.forEach(d => {
        newDays[d] = { ranges: [], enabled: false };
    });

    // Apply rules
    for (const rule of currentRules) {
        for (const day of rule.days) {
            newDays[day] = {
                ranges: rule.slots.map(s => ({ start: s.start, end: s.end })),
                enabled: true
            };
        }
    }

    const scheduleToSave: Schedule = {
        id: currentSchedule?.id, // Preserve ID if existing to update same doc
        provider_id: provider.id,
        type: 'global',
        days: newDays
    };

    try {
        console.log("Saving provider schedule:", scheduleToSave);
        await api.updateProviderSchedule(scheduleToSave);
        console.log("Save successful");
        
        // Refresh to get new ID if created
        currentSchedule = await api.getProviderSchedule(provider.id, 'global');
        
        // Refresh the business store so the services page shows updated data
        await businessState.refreshGlobalSchedule();
        
    } catch (e) {
        console.error("Failed to save schedule", e);
        alert("Failed to save schedule. Check console for details.");
    }
  }

  // Helper to format 24h time to 12h AM/PM
  function formatTime(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
  }

  function getDayLabel(days: string[]) {
    // Naive implementation: if Mon-Fri, say Mon-Fri. Else comma separated.
    // For now, let's just join them nicely.
    // Ideally we sort them first.
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));

    if (days.length === 5 && sorted.join(',') === 'mon,tue,wed,thu,fri') return 'Mon - Fri';
    if (days.length === 2 && sorted.join(',') === 'sat,sun') return 'Sat - Sun';
    
    return sorted.map(d => dayLabels[d]).join(', ');
  }

  function openAddModal() {
    editingRule = null;
    isModalOpen = true;
  }

  function openEditModal(rule: ScheduleRule) {
    editingRule = rule;
    isModalOpen = true;
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this rule?')) {
      rules = rules.filter(r => r.id !== id);
      await saveToBackend(rules);
    }
  }

  async function handleSave(data: { days: string[], slots: TimeSlot[] }) {
    if (editingRule) {
      // Update existing
      rules = rules.map(r => r.id === editingRule!.id ? { ...r, ...data } : r);
    } else {
      // Create new
      const newRule: ScheduleRule = {
        id: crypto.randomUUID(),
        ...data
      };
      rules = [...rules, newRule];
    }
    await saveToBackend(rules);
  }
</script>

<BusinessHoursModal
  isOpen={isModalOpen}
  onClose={() => isModalOpen = false}
  onSave={handleSave}
  initialDays={editingRule?.days}
  initialSlots={editingRule?.slots}
/>

<div class="bg-gray-50 dark:bg-gray-950 min-h-full flex flex-col">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
    <div class="px-4 py-3 flex items-center justify-between">
      <button 
        onclick={onBack}
        class="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <ChevronLeft size={24} />
      </button>
      
      <h1 class="text-lg font-bold text-gray-900 dark:text-white">Global Schedule</h1>
      
      <button 
        onclick={onBack}
        class="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:text-blue-700 dark:hover:text-blue-300"
      >
        Done
      </button>
    </div>
  </header>

  <div class="p-4 space-y-6">
    <div class="space-y-4">
      <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">Weekly availability rules</h2>
      
      {#if rules.length === 0}
        <div class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          No availability rules set.
        </div>
      {:else}
        <div class="space-y-3">
          {#each rules as rule}
            <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-gray-900 dark:text-white text-lg">{getDayLabel(rule.days)}</h3>
                </div>
                
                <div class="flex items-center gap-1">
                    <button 
                        onclick={() => openEditModal(rule)}
                        class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit rule"
                    >
                        <Pencil size={18} />
                    </button>
                    <button 
                        onclick={() => handleDelete(rule.id)}
                        class="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete rule"
                    >
                        <Trash2 size={18} class="fill-red-50" />
                    </button>
                </div>
              </div>

              <div class="space-y-2">
                {#if rule.slots.length === 0}
                   <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                       CLOSED
                   </div>
                {:else}
                   {#each rule.slots as slot}
                     <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                       <Clock size={16} class="text-gray-400" />
                       <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                     </div>
                   {/each}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Add Rule Button -->
      <!-- Dashed border button container -->
       <button 
            onclick={openAddModal}
            class="w-full border-2 border-dashed border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-2xl py-4 flex items-center justify-center gap-2 transition-all group"
        >
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={18} class="stroke-[3]" />
            </div>
            <span class="font-bold text-blue-600 dark:text-blue-400">Add Rule</span>
        </button>
    </div>

  </div>
</div>
