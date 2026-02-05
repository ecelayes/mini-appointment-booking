<script lang="ts">
    import { onMount } from 'svelte';
    import { api, type Appointment } from '$lib/services/api';
    import { authState } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { User as UserIcon, MoreVertical, Calendar, Building2 } from 'lucide-svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import BookingModal from '$lib/components/ui/BookingModal.svelte';

    import { businessState } from "$lib/stores/business.svelte";

    let appointments = $state<Appointment[]>([]);
    let loadingAppointments = $state(true);
    let loading = $derived(businessState.loading || loadingAppointments);
    let isBookingModalOpen = $state(false);
    
    // Derived from store
    let hasServices = $derived(businessState.services.length > 0);
    let globalSchedule = $derived(businessState.globalSchedule);
    let provider = $derived(businessState.provider);
    
    // Check if there are any enabled days with slots
    let hasActiveSchedule = $derived(
        globalSchedule && globalSchedule.days 
        ? Object.values(globalSchedule.days).some(d => d.enabled && d.ranges && d.ranges.length > 0)
        : false
    );

    let hasMissingConfig = $derived(!hasServices || !hasActiveSchedule || !provider);

    onMount(() => {
        loadPageData();
    });

    async function loadPageData() {
        loadingAppointments = true;
        try {
            // Load core business data (provider, services) via store
            await businessState.loadBusinessData();

            if (businessState.services.length > 0) {
                const res = await api.getAppointments({ type: 'upcoming', limit: 20 });
                
                const today = new Date();
                const todayStr = today.toDateString();

                appointments = res
                    .filter(a => {
                        const d = new Date(a.date);
                        return d.toDateString() === todayStr && a.status !== 'cancelled';
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            } else {
                appointments = [];
            }
        } catch (e) {
            console.error(e);
        } finally {
            loadingAppointments = false;
        }
    }

    function getAmPm(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour12: true }).split(' ')[1];
    }

    function getTimeOnly(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0];
    }

</script>

<BookingModal 
    isOpen={isBookingModalOpen} 
    onClose={() => isBookingModalOpen = false} 
    onSuccess={() => {
        loadPageData();
    }}
/>

<div class="bg-gray-50 px-6 pt-8 min-h-full pb-20">
    <!-- Header -->
    <header class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Home</h1>
        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden">
            {#if authState.user?.picture}
                <img src={authState.user.picture} alt="Profile" class="h-full w-full object-cover" />
            {:else}
                <UserIcon size={20} />
            {/if}
        </div>
    </header>

    <div class="space-y-8">
        <!-- Greetings -->
        <section>
            <h2 class="text-3xl font-extrabold text-gray-900 mb-6">
                Welcome back, {authState.user?.name || 'User'}!
            </h2>
            
            {#if hasServices && hasActiveSchedule}
            <Button fullWidth onclick={() => isBookingModalOpen = true} class="h-14 text-lg shadow-blue-200/50 shadow-lg">
                Book a New Appointment
            </Button>
            {/if}
        </section>

        <!-- Missing Config Notifications -->
        {#if hasMissingConfig && !loading}
             <div class="flex flex-col gap-3">
                {#if !provider}
                <section class="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-4">
                    <div class="bg-purple-100 p-2 rounded-xl text-purple-600 shrink-0">
                        <Building2 size={24} />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-900 text-sm mb-1">Configure Business Profile</h3>
                        <p class="text-xs text-purple-800/80 leading-relaxed mb-3">
                             You need to upload your business details to start accepting bookings.
                        </p>
                        <a href="/profile?action=edit_business" class="inline-flex items-center text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                            Setup Profile
                        </a>
                    </div>
                </section>
                {/if}

                {#if !hasActiveSchedule}
                <section class="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
                    <div class="bg-blue-100 p-2 rounded-xl text-blue-600 shrink-0">
                        <Calendar size={24} />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-900 text-sm mb-1">Set up your Business Hours</h3>
                        <p class="text-xs text-blue-700/80 leading-relaxed mb-3">
                            Customers won't be able to book appointments until you define your weekly availability.
                        </p>
                        <a href="/services?tab=hours" class="inline-flex items-center text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                            Configure Schedule
                        </a>
                    </div>
                </section>
                {/if}

                {#if !hasServices}
                <section class="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-4">
                    <div class="bg-yellow-100 p-2 rounded-xl text-yellow-600 shrink-0">
                        <MoreVertical size={24} />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-900 text-sm mb-1">Create your Services</h3>
                         <p class="text-xs text-yellow-800/80 leading-relaxed mb-3">
                            Start by adding the services you offer to your clients.
                        </p>
                        <a href="/services" class="inline-flex items-center text-xs font-bold text-yellow-700 bg-white border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors">
                            Add Services
                        </a>
                    </div>
                </section>
                {/if}
             </div>
        {/if}

         <!-- Today's Appointments -->

        {#if hasServices && (hasActiveSchedule || loading)}
        <section>
            <h3 class="text-lg font-bold text-gray-900 mb-4">Today's Appointments</h3>
            
            <div class="flex flex-col gap-4">
                {#if loading}
                    <div class="animate-pulse flex flex-col gap-4">
                        <div class="h-24 bg-gray-200 rounded-2xl w-full"></div>
                        <div class="h-24 bg-gray-200 rounded-2xl w-full"></div>
                    </div>
                {:else if appointments.length === 0}
                    <div class="text-center py-10 bg-white rounded-2xl border-dashed border-2 border-gray-100">
                        <p class="text-gray-400 font-medium">No appointments for today.</p>
                    </div>
                {:else}
                    {#each appointments as appt}
                        <Card class="flex gap-4 p-4">
                            <!-- Time Box -->
                            <div class="flex flex-col items-center justify-center w-16 h-20 bg-indigo-100 rounded-xl shrink-0 text-indigo-600">
                                <span class="text-xs font-bold">{getAmPm(appt.date)}</span>
                                <span class="text-xl font-bold leading-none">{getTimeOnly(appt.date)}</span>
                            </div>

                            <!-- Info -->
                            <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <h4 class="font-bold text-gray-900 text-lg leading-tight truncate">
                                    {businessState.services.find(s => s.id === appt.serviceId)?.name || 'Unknown Service'}
                                </h4>
                                <p class="text-xs text-green-600 font-medium mt-1">
                                    Confirmed
                                </p>
                            </div>

                            <!-- Action -->
                             <button class="text-gray-400 hover:text-gray-600 self-start">
                                <MoreVertical size={20} />
                            </button>
                        </Card>
                    {/each}
                {/if}
            </div>
        </section>
        {/if}
    </div>
</div>
