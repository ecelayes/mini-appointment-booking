<script lang="ts">
    import Modal from './Modal.svelte';
    import { themeState } from '$lib/stores/theme.svelte';
    import { Sun, Moon, Monitor } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    const themes = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: Monitor }
    ] as const;
</script>

<Modal {isOpen} title="App Theme" {onClose}>
    <div class="space-y-4">
        {#each themes as theme}
            <button
                class="w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left
                {themeState.current === theme.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'}"
                onclick={() => themeState.setTheme(theme.id)}
            >
                <div class="flex items-center gap-4">
                    <theme.icon size={20} />
                    <span class="font-medium">{theme.label}</span>
                </div>
                {#if themeState.current === theme.id}
                    <div class="w-3 h-3 rounded-full bg-current"></div>
                {/if}
            </button>
        {/each}
    </div>
</Modal>
