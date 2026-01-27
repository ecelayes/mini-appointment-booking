<script lang="ts">
    import { onMount } from 'svelte';
    import { api, type Service } from '$lib/services/api';
    import { goto } from '$app/navigation';
    import Header from '$lib/components/layout/Header.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    // Icons
    import { Stethoscope, Scissors, Heart, Eye, Brain, PawPrint } from 'lucide-svelte';

    let services = $state<Service[]>([]);
    let loading = $state(true);
    let searchTerm = $state('');

    const iconMap: Record<string, any> = {
        'dental': Stethoscope,
        'cut': Scissors,
        'massage': Heart, // approximation
        'eye': Eye,
        'brain': Brain,
        'paw': PawPrint
    };

    onMount(async () => {
        try {
            services = await api.getServices();
        } catch(e) { console.error(e) } 
        finally { loading = false; }
    });

    let filteredServices = $derived(services.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ));
</script>

<div class="bg-gray-50">
    <Header title="Select a Service" backUrl="/home" />

    <!-- Search -->
    <div class="px-6 mb-6">
        <div class="relative">
            <input 
                type="text" 
                placeholder="Search for services..." 
                bind:value={searchTerm}
                class="w-full h-12 pl-12 pr-4 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"
            />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 gap-4 px-6">
        {#if loading}
             <div class="col-span-2 text-center text-gray-400 py-10">Loading services...</div>
        {:else}
            {#each filteredServices as service}
                {@const Icon = iconMap[service.icon || ''] || Stethoscope}
                <Card 
                    onclick={() => goto(`/booking/date/${service.id}`)}
                    class="flex flex-col gap-3 min-h-[160px] justify-between items-start hover:border-blue-200 hover:ring-2 hover:ring-blue-100"
                >
                    <div class="h-10 w-10 text-blue-600">
                        <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 leading-tight mb-1">{service.name}</h3>
                        <p class="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                            {service.description}
                        </p>
                    </div>
                </Card>
            {/each}
        {/if}
    </div>
</div>
