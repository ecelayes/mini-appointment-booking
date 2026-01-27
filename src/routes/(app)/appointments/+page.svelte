<script lang="ts">
   import { onMount } from 'svelte';
   import { api, type Appointment } from '$lib/services/api';
   import { MoreVertical } from 'lucide-svelte';
   import Card from '$lib/components/ui/Card.svelte';

   let activeTab = $state<'upcoming' | 'past'>('upcoming');
   let appointments = $state<Appointment[]>([]);
   let loading = $state(true);

   onMount(async () => {
       try {
           appointments = await api.getAppointments();
       } catch (e) {
           console.error(e);
       } finally {
           loading = false;
       }
   });

   let filteredAppointments = $derived(appointments.filter(a => {
       const isPast = new Date(a.date) < new Date(); // Simple check
       // Or use status
       if (activeTab === 'upcoming') return a.status !== 'completed' && a.status !== 'cancelled' && !isPast;
       return a.status === 'completed' || isPast;
   }));

   function formatDay(dateStr: string) {
       return new Date(dateStr).getDate();
   }
   
   function formatMonth(dateStr: string) {
       return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
   }

   function formatTime(dateStr: string) {
       return new Date(dateStr).toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric' }).split(', ')[1];
   }
</script>

<div class="bg-gray-50 px-6 pt-8">
   <header class="mb-6">
       <h1 class="text-2xl font-bold tracking-tight text-gray-900">Appointments</h1>
   </header>

   <!-- Tabs -->
   <div class="flex border-b border-gray-200 mb-6 relative">
       <button 
           class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab === 'upcoming' ? 'text-blue-600' : 'text-gray-500'}"
           onclick={() => activeTab = 'upcoming'}
       >
           Upcoming
           {#if activeTab === 'upcoming'}
               <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
           {/if}
       </button>
       <button 
           class="flex-1 pb-3 text-sm font-semibold transition-colors relative {activeTab === 'past' ? 'text-blue-600' : 'text-gray-500'}"
           onclick={() => activeTab = 'past'}
       >
           Past
           {#if activeTab === 'past'}
               <div class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
           {/if}
       </button>
   </div>

   <!-- List -->
   <div class="flex flex-col gap-4">
       {#if loading}
            <div class="space-y-4">
                <div class="h-32 bg-gray-200 rounded-2xl w-full animate-pulse"></div>
                <div class="h-32 bg-gray-200 rounded-2xl w-full animate-pulse"></div>
            </div>
       {:else if filteredAppointments.length === 0}
            <div class="text-center py-10 text-gray-500">
                No {activeTab} appointments found.
            </div>
       {:else}
            {#each filteredAppointments as appt}
                <Card class="flex gap-4 p-4">
                    <!-- Date Box -->
                    <div class="flex flex-col items-center justify-center w-16 h-20 bg-indigo-100 rounded-xl shrink-0 text-indigo-600">
                        <span class="text-xs font-bold">{formatMonth(appt.date)}</span>
                        <span class="text-2xl font-bold leading-none">{formatDay(appt.date)}</span>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                        <h3 class="font-bold text-gray-900 text-lg leading-tight">{appt.serviceName}</h3>
                        <p class="text-sm text-gray-500">{formatTime(appt.date)}</p>
                        {#if appt.providerName}
                             <p class="text-xs text-gray-400 mt-1">with {appt.providerName} at {appt.location?.split(',')[0]}</p>
                        {/if}
                    </div>

                    <!-- Action -->
                    <button class="text-gray-400 hover:text-gray-600 self-start">
                        <MoreVertical size={20} />
                    </button>
                </Card>
            {/each}
       {/if}
   </div>
</div>
