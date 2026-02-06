<script lang="ts">
   import { onMount } from 'svelte';
   import { api, type Appointment, type Service } from '$lib/services/api';
   import { Trash2 } from 'lucide-svelte';
   import Card from '$lib/components/ui/Card.svelte';
   import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

   let activeTab = $state<'upcoming' | 'past'>('upcoming');
   let appointments = $state<Appointment[]>([]);
   let services = $state<Service[]>([]);
   let loading = $state(false);
   let offset = $state(0);
   let hasMore = $state(true);
   const LIMIT = 10;
   let cancelModalOpen = $state(false);
   let providerId = $state<string | undefined>(undefined);
   let appointmentToCancel = $state<Appointment | null>(null);
   
   let observer: IntersectionObserver;
   let sentinel: HTMLElement;

   // Load initial data
   onMount(async () => {
       try {
           const provider = await api.getMyProvider();
           if (provider) {
               providerId = provider.id;
               // Load services using provider ID
               services = await api.getServices(providerId);
               // Load appointments only if we have a provider
               loadMore();
           } else {
             console.warn("No provider found for current user");
             hasMore = false; // No provider, so no appointments to load. Prevents infinite loop.
           }
       } catch (e) {
           console.error('Failed to load initial data:', e);
           hasMore = false;
       }
   });

   function getServiceName(serviceId: string): string {
       const service = services.find(s => s.id === serviceId);
       return service?.name || 'Unknown Service';
   }

   function changeTab(tab: 'upcoming' | 'past') {
       if (activeTab === tab) return;
       activeTab = tab;
       appointments = [];
       offset = 0;
       hasMore = true;
       // Only load if we have a provider
       if (providerId) {
           loadMore();
       } else {
           hasMore = false;
       }
   }

   async function loadMore() {
       if (loading || !hasMore || !providerId) return;
       loading = true;
       try {
           const newAppointments = await api.getAppointments({
               type: activeTab,
               limit: LIMIT,
               offset,
               providerId: providerId
           });
           
           if (newAppointments.length < LIMIT) {
               hasMore = false;
           }

           appointments = [...appointments, ...newAppointments];
           offset += LIMIT;
       } catch (e) {
           console.error(e);
           hasMore = false; // Stop trying if error occurs
       } finally {
           loading = false;
       }
   }

   // Infinite scroll observer
   $effect(() => {
       if (sentinel && hasMore && !loading) {
           observer = new IntersectionObserver((entries) => {
               if (entries[0].isIntersecting) {
                   loadMore();
               }
           });
           observer.observe(sentinel);
           return () => observer.disconnect();
       }
   });

   function formatDay(dateStr: string) {
       return new Date(dateStr).getDate();
   }
   
   function formatMonth(dateStr: string) {
       return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
   }

   function formatTime(dateStr: string) {
       return new Date(dateStr).toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric' }).split(', ')[1];
   }

   function handleCancel(appt: Appointment) {
       appointmentToCancel = appt;
       cancelModalOpen = true;
   }

   async function confirmCancel() {
       if (!appointmentToCancel) return;

       try {
           await api.cancelAppointment(appointmentToCancel.id);
           // Refresh the list
           appointments = [];
           offset = 0;
           hasMore = true;
           await loadMore();
           cancelModalOpen = false;
           appointmentToCancel = null;
       } catch (e) {
           console.error(e);
           alert('Failed to cancel appointment');
           cancelModalOpen = false;
           appointmentToCancel = null;
       }
   }
</script>

<div class="bg-gray-50 dark:bg-gray-950 px-6 pt-8 pb-20 min-h-full">
   <header class="mb-6">
       <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Appointments</h1>
   </header>

   <!-- Tabs -->
   <div class="flex border-b border-gray-200 dark:border-gray-800 mb-6 relative">
       <button 
           class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab === 'upcoming' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}"
           onclick={() => changeTab('upcoming')}
       >
           Upcoming
           {#if activeTab === 'upcoming'}
               <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
           {/if}
       </button>
       <button 
           class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab === 'past' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}"
           onclick={() => changeTab('past')}
       >
           Past
           {#if activeTab === 'past'}
               <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>
           {/if}
       </button>
   </div>

   <!-- List -->
   <div class="flex flex-col gap-4">
        {#each appointments as appt}
            <Card class="flex gap-4 p-4">
                <!-- Date Box -->
                <div class="flex flex-col items-center justify-center w-16 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shrink-0 text-indigo-600 dark:text-indigo-400">
                    <span class="text-xs font-bold">{formatMonth(appt.date)}</span>
                    <span class="text-2xl font-bold leading-none">{formatDay(appt.date)}</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <h3 class="font-bold text-gray-900 dark:text-white text-lg leading-tight">{getServiceName(appt.serviceId)}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{formatTime(appt.date)}</p>
                </div>

                <!-- Action -->
                {#if activeTab === 'upcoming'}
                    <button 
                        onclick={() => handleCancel(appt)}
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors self-center"
                    >
                        <Trash2 size={18} />
                    </button>
                {/if}
            </Card>
        {/each}

        {#if loading && appointments.length === 0}
             <div class="space-y-4">
                 <div class="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full animate-pulse"></div>
                 <div class="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full animate-pulse"></div>
             </div>
        {:else if appointments.length === 0 && !loading}
             <div class="text-center py-10 text-gray-500 dark:text-gray-400">
                 No {activeTab} appointments found.
             </div>
        {/if}

        {#if hasMore}
             <div bind:this={sentinel} class="h-10 flex items-center justify-center p-4">
                 {#if loading && appointments.length > 0}
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                 {/if}
             </div>
        {/if}
   </div>
</div>

<ConfirmModal
  isOpen={cancelModalOpen}
  title="Cancel Appointment?"
  message={appointmentToCancel ? `Are you sure you want to cancel your appointment for ${appointmentToCancel.serviceName}? This action cannot be undone.` : ''}
  confirmText="Cancel Appointment"
  cancelText="Keep Appointment"
  onConfirm={confirmCancel}
  onCancel={() => { cancelModalOpen = false; appointmentToCancel = null; }}
/>
