<script lang="ts">
  import { X } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { 
    isOpen, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    onConfirm, 
    onCancel 
  }: Props = $props();

  function handleBackdropClick() {
    onCancel();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" 
    onclick={handleBackdropClick}
    role="button" 
    tabindex="0"
  >
    
    <!-- Modal Container -->
    <div 
        class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
    >
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <h2 id="confirm-modal-title" class="text-xl font-bold text-gray-900 dark:text-white">
                {title}
            </h2>
            <button 
              onclick={onCancel} 
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
                <X size={20} />
            </button>
        </div>

        <!-- Body -->
        <div class="p-6">
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                {message}
            </p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex gap-3 justify-end">
            <button 
              onclick={onCancel}
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                {cancelText}
            </button>
            <button 
              onclick={onConfirm}
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
                {confirmText}
            </button>
        </div>
    </div>
  </div>
{/if}
