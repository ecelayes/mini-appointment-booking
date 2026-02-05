<script>
    import '../app.css';
    import { authState } from '$lib/stores/auth.svelte';
    import { themeState } from '$lib/stores/theme.svelte';
    import { onMount } from 'svelte';

    onMount(() => {
        authState.init();
        themeState.init();
    });
</script>

<div class="h-dvh w-full flex justify-center bg-gray-100 dark:bg-gray-900 font-sans antialiased overflow-hidden">
    <div class="w-full max-w-md h-full bg-gray-50 dark:bg-gray-950 text-gray-900 shadow-2xl overflow-hidden relative flex flex-col">
        <slot />
    </div>
</div>
