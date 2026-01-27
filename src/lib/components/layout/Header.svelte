<script lang="ts">
    import { ArrowLeft } from 'lucide-svelte';
    import { goto } from '$app/navigation';

    interface Props {
        title: string;
        showBack?: boolean;
        backUrl?: string;
    }

    let { title, showBack = true, backUrl }: Props = $props();

    function handleBack() {
        if (backUrl) {
            goto(backUrl);
        } else {
            history.back();
        }
    }
</script>

<header class="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md px-6 py-4 flex items-center mb-2">
    {#if showBack}
        <button onclick={handleBack} class="absolute left-6 p-2 -ml-2 hover:bg-gray-200/50 rounded-full transition-colors select-none" aria-label="Go back">
            <ArrowLeft size={24} class="text-gray-900" />
        </button>
    {/if}
    <h1 class="flex-1 text-center text-lg font-bold text-gray-900 leading-none pt-0.5">
        {title}
    </h1>
</header>
