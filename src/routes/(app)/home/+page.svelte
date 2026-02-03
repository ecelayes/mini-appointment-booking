<script lang="ts">
    import { onMount } from 'svelte';
    import { api, type Appointment } from '$lib/services/api';
    import { authState } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { User as UserIcon, MoreVertical } from 'lucide-svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import BookingModal from '$lib/components/ui/BookingModal.svelte';

    let appointments = $state<Appointment[]>([]);
    let loading = $state(true);
    let isBookingModalOpen = $state(false);

    onMount(() => {
        loadAppointments();
    });

    async function loadAppointments() {
        loading = true;
        try {
            const res = await api.getAppointments({ type: 'upcoming', limit: 20 });
            
            const today = new Date();
            const todayStr = today.toDateString();

            appointments = res
                .filter(a => {
                    const d = new Date(a.date);
                    return d.toDateString() === todayStr && a.status !== 'cancelled';
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
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
        loadAppointments();
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
            
            <Button fullWidth onclick={() => isBookingModalOpen = true} class="h-14 text-lg shadow-blue-200/50 shadow-lg">
                Book a New Appointment
            </Button>
        </section>

        <!-- Today's Appointments -->
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
                                <h4 class="font-bold text-gray-900 text-lg leading-tight truncate">{appt.serviceName}</h4>
                                {#if appt.providerName}
                                    <p class="text-xs text-gray-400 mt-1">with {appt.providerName}</p>
                                {/if}
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
    </div>
</div>
