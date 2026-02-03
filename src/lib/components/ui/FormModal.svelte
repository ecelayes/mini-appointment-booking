<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onSave: () => Promise<void>;
    isValid?: boolean;
    saveLabel?: string;
    children?: import('svelte').Snippet;
  }

  let { 
    isOpen, 
    title, 
    onClose, 
    onSave, 
    isValid = true, 
    saveLabel = 'Save', 
    children 
  }: Props = $props();

  let saving = $state(false);

  async function handleSubmit() {
    if (!isValid) return;
    
    saving = true;
    try {
        await onSave();
        onClose();
    } catch (e) {
        console.error(e);
        // We might want to expose error handling better in the future
        alert('Failed to save. Please try again.');
    } finally {
        saving = false;
    }
  }
</script>

{#snippet footerContent()}
    <button 
        onclick={handleSubmit}
        disabled={saving || !isValid}
        class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
        {saving ? 'Saving...' : saveLabel}
    </button>
{/snippet}

<Modal 
    {isOpen} 
    {title} 
    {onClose}
    footer={footerContent}
>
    {@render children?.()}
</Modal>
