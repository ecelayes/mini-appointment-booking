<script lang="ts">
  import { X } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let { isOpen, title, onClose, children, footer }: Props = $props();
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm transition-opacity" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()}>
    
    <!-- Modal Container -->
    <div 
        class="bg-white w-full sm:max-w-md h-[85vh] sm:h-auto rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onclick={(e) => e.stopPropagation()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Escape' && onClose()}
    >
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
            <h2 class="text-xl font-bold text-gray-900">
                {title}
            </h2>
            <button onclick={onClose} class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
            </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6 flex-1 overflow-y-auto">
            {@render children?.()}
        </div>

        <!-- Footer -->
        {#if footer}
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            {@render footer()}
        </div>
        {/if}
    </div>
  </div>
{/if}
