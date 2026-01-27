<script lang="ts">
    import { authState } from '$lib/stores/auth.svelte';
    import { 
        Bell, 
        Shield, 
        CircleHelp, 
        LogOut, 
        ChevronRight
    } from 'lucide-svelte';

    function handleLogout() {
        authState.logout();
    }

    const menuItems = [
        {
            group: 'SETTINGS',
            items: [
                { label: 'Notifications', icon: Bell, href: '/settings/notifications' },
                { label: 'Privacy & Security', icon: Shield, href: '/settings/privacy' }
            ]
        },
        {
            group: 'ACCOUNT',
            items: [
                { label: 'Help & Support', icon: CircleHelp, href: '/support' },
                { label: 'Log Out', icon: LogOut, action: handleLogout, variant: 'danger' }
            ]
        }
    ];
</script>

<div class="bg-gray-50">
    <!-- Header -->
    <header class="relative px-6 py-6 flex items-center justify-center mb-4">
        <h1 class="text-xl font-bold text-gray-900">Profile</h1>
    </header>

    <!-- Profile Info -->
    <div class="flex flex-col items-center mb-8">
        <div class="relative mb-4">
            <div class="h-28 w-28 rounded-full p-1 bg-gradient-to-br from-orange-200 to-gray-600 shadow-xl overflow-hidden">
                <div class="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                    {#if authState.user?.picture}
                        <img src={authState.user.picture} alt="Profile" class="h-full w-full object-cover" />
                    {:else}
                         <!-- Placeholder avatar -->
                         <div class="h-full w-full bg-orange-300 relative">
                            <div class="absolute inset-x-4 top-4 bottom-0 bg-white shadow-sm rounded-t-lg"></div>
                         </div>
                    {/if}
                </div>
            </div>
            <!-- Google Badge Icon -->
            <div class="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5"/>
            </div>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-1">{authState.user?.name || 'Jordan Smith'}</h2>
        <p class="text-gray-500 text-sm mb-3">{authState.user?.email || 'jordan.smith@example.com'}</p>
        
        <div class="px-3 py-1 bg-blue-50 text-[#597dff] rounded-full text-xs font-semibold border border-blue-100">
            Linked with Google
        </div>
    </div>

    <!-- Menu -->
    <div class="px-6 space-y-6">
        {#each menuItems as group}
            <div class="space-y-3">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{group.group}</h3>
                
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left">
                    {#each group.items as item, i}
                        {#if i > 0}
                            <div class="h-[1px] bg-gray-50 mx-4"></div>
                        {/if}
                        
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div 
                            class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onclick={item.action}
                        >
                            <div class="flex items-center gap-4">
                                <div class="h-10 w-10 rounded-full {item.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center shrink-0">
                                    <item.icon size={20} />
                                </div>
                                <span class="font-semibold {item.variant === 'danger' ? 'text-red-500' : 'text-gray-900'}">
                                    {item.label}
                                </span>
                            </div>
                            {#if item.variant !== 'danger'}
                                <ChevronRight size={20} class="text-gray-300" />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/each}

        <!-- Footer Note -->
        <p class="text-center text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mt-8">
            Your profile information is managed through your connected Google account. To update your name or photo, please visit your Google settings.
        </p>
    </div>
</div>
