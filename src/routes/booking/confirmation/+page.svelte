<script lang="ts">
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import { Check, Calendar, Clock, MapPin, Scissors } from 'lucide-svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { api, type Appointment } from '$lib/services/api';

    let appointmentId = $derived($page.url.searchParams.get('id'));
    let appointment = $state<Appointment | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);

    onMount(async () => {
        if (appointmentId) {
            try {
                appointment = await api.getAppointment(appointmentId);
            } catch (e: any) {
                error = e.message;
            } finally {
                loading = false;
            }
        } else {
            loading = false;
        }
    });

    function formatDate(isoString: string) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function formatTime(isoString: string) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
</script>

<div class="bg-gray-50 flex flex-col items-center justify-center p-6 text-center h-full min-h-screen">
    
    <div class="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-8">
        <div class="bg-blue-600 rounded-full p-2">
             <Check size={40} class="text-white" strokeWidth={3} />
        </div>
    </div>

    <h1 class="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Appointment Confirmed!</h1>
    <p class="text-gray-500 mb-10 max-w-xs mx-auto">We've sent a confirmation to your email.</p>

    <!-- Details Card -->
    <Card class="w-full max-w-sm mb-10 text-left space-y-6 !p-6">
        {#if loading}
            <div class="flex justify-center p-4">Loading details...</div>
        {:else if error}
            <div class="text-red-500 text-center">Failed to load appointment details.</div>
        {:else if appointment}
            <div class="flex items-start gap-4">
                 <div class="text-blue-500 mt-1"><Scissors size={20}/></div>
                 <div>
                     <p class="text-sm text-gray-400 font-medium">Service</p>
                     <p class="font-bold text-gray-900 text-lg">{appointment.serviceName}</p>
                 </div>
            </div>
            <hr class="border-gray-100" />
             <div class="flex items-start gap-4">
                 <div class="text-blue-500 mt-1"><Calendar size={20}/></div>
                 <div>
                     <p class="text-sm text-gray-400 font-medium">Date</p>
                     <p class="font-bold text-gray-900 text-lg">{formatDate(appointment.date)}</p>
                 </div>
            </div>
            <hr class="border-gray-100" />
             <div class="flex items-start gap-4">
                 <div class="text-blue-500 mt-1"><Clock size={20}/></div>
                 <div>
                     <p class="text-sm text-gray-400 font-medium">Time</p>
                     <p class="font-bold text-gray-900 text-lg">{formatTime(appointment.date)}</p>
                 </div>
            </div>
            <hr class="border-gray-100" />
             <div class="flex items-start gap-4">
                 <div class="text-blue-500 mt-1"><MapPin size={20}/></div>
                 <div>
                     <p class="text-sm text-gray-400 font-medium">Location</p>
                     <p class="font-bold text-gray-900 text-lg">{appointment.location || 'Online'}</p>
                 </div>
            </div>
        {:else}
            <div class="text-center text-gray-500">No appointment found.</div>
        {/if}
    </Card>

    <div class="w-full max-w-sm space-y-3">

        <Button fullWidth onclick={() => goto('/home')}>
            Done
        </Button>
    </div>

</div>
