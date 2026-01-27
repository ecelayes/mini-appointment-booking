<script>
    import Navbar from '$lib/components/layout/Navbar.svelte';
</script>

<div class="flex flex-col h-full w-full">
    <main class="flex-1 overflow-y-auto w-full relative">
        <slot />
    </main>
    <Navbar />
</div>
