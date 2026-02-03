<script lang="ts">
    import Modal from './Modal.svelte';
    import { AlertTriangle } from 'lucide-svelte';
    import Button from './Button.svelte';

    interface Props {
        isOpen: boolean;
        title?: string;
        message: string;
        actionLabel?: string;
        onClose: () => void;
        onAction?: () => void;
    }

    let { isOpen, title = 'Action Required', message, actionLabel = 'Go to Settings', onClose, onAction }: Props = $props();
</script>

<Modal {isOpen} {onClose} title="">
    <div class="flex flex-col items-center text-center p-4">
        <div class="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
        </div>
        
        <h3 class="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p class="text-gray-500 mb-8 max-w-xs">{message}</p>

        <div class="flex flex-col gap-3 w-full">
            {#if onAction}
                <Button fullWidth onclick={onAction}>
                    {actionLabel}
                </Button>
            {/if}
            <button 
                class="text-gray-500 font-medium py-3 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                onclick={onClose}
            >
                Cancel
            </button>
        </div>
    </div>
</Modal>
