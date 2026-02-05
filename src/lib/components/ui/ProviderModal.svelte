<script lang="ts">
    import { onMount } from 'svelte';
    import FormModal from './FormModal.svelte';
    import { api, type Provider } from '$lib/services/api';
    import { authState } from '$lib/stores/auth.svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let establishmentName = $state('');
    let address = $state('');
    let phone = $state('');
    let providerId = $state<string | null>(null);
    let loading = $state(false);

    $effect(() => {
        if (isOpen) {
            loadProvider();
        }
    });

    async function loadProvider() {
        loading = true;
        try {
            const provider = await api.getMyProvider();
            if (provider) {
                providerId = provider.id;
                establishmentName = provider.establishment_name || '';
                address = provider.address || '';
                phone = provider.phone || '';
            } else {
                // Initialize defaults if creating fresh
                providerId = null;
                establishmentName = '';
                address = '';
                phone = '';
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function handleSave() {
        const data = {
            establishment_name: establishmentName,
            address: address,
            phone: phone
        };

        if (providerId) {
            await api.updateProvider(providerId, data);
        } else {
            await api.createProvider({
                ...data,
                full_name: authState.user?.name || 'Provider',
                user_id: authState.user?.id,
                schedule: {}
            });
        }
    }
</script>

<FormModal 
    {isOpen} 
    title="Business Details" 
    {onClose}
    onSave={handleSave}
    isValid={!!establishmentName}
    saveLabel="Save Details"
>
    {#if loading}
        <div class="space-y-4 animate-pulse">
            <div class="h-12 bg-gray-100 rounded-xl w-full"></div>
            <div class="h-12 bg-gray-100 rounded-xl w-full"></div>
            <div class="h-12 bg-gray-100 rounded-xl w-full"></div>
        </div>
    {:else}
        <!-- Establishment Name -->
        <div class="space-y-2">
            <label for="estNAme" class="block text-sm font-medium text-gray-700">Establishment Name</label>
            <input 
                type="text" 
                id="estNAme"
                bind:value={establishmentName}
                placeholder="e.g. Runik Salon"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>

        <!-- Address -->
        <div class="space-y-2">
            <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
            <input 
                type="text" 
                id="address"
                bind:value={address}
                placeholder="e.g. 123 Main St"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>

        <!-- Phone -->
        <div class="space-y-2">
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
            <input 
                type="tel" 
                id="phone"
                bind:value={phone}
                placeholder="e.g. +1 234 567 890"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>
    {/if}
</FormModal>
