<script lang="ts">
   import { page } from '$app/stores';
    import { House, Calendar, User, Search, Store } from 'lucide-svelte';

    const navItems = [
        { href: '/home', label: 'Home', icon: House },
        { href: '/appointments', label: 'Appointments', icon: Calendar },
        { href: '/services', label: 'Manage', icon: Store },
        { href: '/profile', label: 'Profile', icon: User }
    ];

   let currentPath = $derived($page.url.pathname);

   // Helper to check if item is active (simple check, maybe improvements later)
   function isActive(href: string) {
       return currentPath.startsWith(href);
   }
</script>

<nav class="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-6 py-3 z-50 shrink-0 w-full">
    <div class="grid grid-cols-4 items-center justify-items-center w-full max-w-md mx-auto">
        {#each navItems as item}
            {@const active = isActive(item.href)}
           <a 
               href={item.href}
               class="flex flex-col items-center gap-1 transition-colors {active ? 'text-[#597dff] dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}"
           >
               <!-- Using fill to simulate active state if supported by lucide, or stroke width -->
               <item.icon 
                    size={26} 
                    strokeWidth={active ? 2.5 : 2} 
                    class={active ? "fill-current" : ""}
                />
               <span class="text-[10px] font-bold tracking-wide">{item.label}</span>
           </a>
       {/each}
   </div>
</nav>
