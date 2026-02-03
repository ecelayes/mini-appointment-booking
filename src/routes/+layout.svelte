<script>
    import '../app.css';
    import { authState } from '$lib/stores/auth.svelte';
    import { onMount } from 'svelte';

    onMount(() => {
        authState.init();
    });
</script>

<div class="h-dvh w-full bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden">
    <slot />
</div>
