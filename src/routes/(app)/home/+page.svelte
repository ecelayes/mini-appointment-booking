<script lang="ts">
    import { onMount } from 'svelte';
    import { api, type Appointment } from '$lib/services/api';
    import { authState } from '$lib/stores/auth.svelte';
    import { goto } from '$app/navigation';
    import { Calendar, User as UserIcon } from 'lucide-svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';

    let appointments = $state<Appointment[]>([]);
    let loading = $state(true);

    onMount(async () => {
        try {
            appointments = await api.getAppointments();
            // Filter only upcoming confirmed ones for home
            appointments = appointments.filter(a => a.status === 'confirmed').slice(0, 3);
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    }
</script>

<div class="bg-gray-50 px-6 pt-8">
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
            
            <Button fullWidth onclick={() => goto('/booking/services')} class="h-14 text-lg shadow-blue-200/50 shadow-lg">
                Book a New Appointment
            </Button>
        </section>

        <!-- Upcoming -->
        <section>
            <h3 class="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments</h3>
            
            <div class="flex flex-col gap-4">
                {#if loading}
                    <div class="animate-pulse flex flex-col gap-4">
                        <div class="h-24 bg-gray-200 rounded-2xl w-full"></div>
                        <div class="h-24 bg-gray-200 rounded-2xl w-full"></div>
                    </div>
                {:else if appointments.length === 0}
                    <p class="text-gray-500 text-center py-8">No upcoming appointments.</p>
                {:else}
                    {#each appointments as appointment}
                        <Card class="flex items-center gap-4">
                            <div class="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <Calendar size={20} />
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-gray-900 truncate">{appointment.serviceName}</h4>
                                <p class="text-sm text-gray-500">{formatDate(appointment.date)}</p>
                            </div>
                        </Card>
                    {/each}
                {/if}
            </div>
        </section>
    </div>
</div>
