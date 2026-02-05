<script lang="ts">
    import { api } from '$lib/services/api';
    import { authState } from '$lib/stores/auth.svelte';
    import { signInWithGoogle } from '$lib/services/firebase';
    import { goto } from '$app/navigation';
    import { Calendar } from 'lucide-svelte';

    let loading = $state(false);
    let error = $state('');

    async function handleGoogleLogin() {
        loading = true;
        error = '';
        authState.loggingIn = true;
        
        try {
            const idToken = await signInWithGoogle();
            const { token } = await api.login(idToken);
            const user = await api.getMe(token);
            authState.setUser(user, token);
            goto('/home');
        } catch (err: any) {
            console.error(err);
            error = err.message || 'Login failed';
        } finally {
            loading = false;
            authState.loggingIn = false;
        }
    }
</script>

<div class="flex flex-col items-center justify-between h-full overflow-y-auto px-6 py-10 bg-gray-50/50">
    <!-- Spacer for vertical centering -->
    <div class="flex-1"></div>

    <div class="w-full max-w-sm flex flex-col items-center text-center gap-8 mb-8">
        <!-- Icon -->
        <div class="h-24 w-24 bg-[#597dff] rounded-3xl flex items-center justify-center shadow-blue-200 shadow-xl rotate-3">
            <Calendar class="text-white" size={40} strokeWidth={2.5} />
        </div>

        <!-- Text -->
        <div class="space-y-4">
            <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome</h1>
            <p class="text-slate-500 font-medium text-lg leading-relaxed max-w-[280px] mx-auto">
                Sign in to manage your appointments and schedule effortlessly.
            </p>
        </div>

        <!-- Action -->
        <div class="w-full pt-4 space-y-6">
            <button 
                onclick={handleGoogleLogin}
                disabled={loading}
                class="cursor-pointer w-full h-14 bg-white border border-blue-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed select-none"
            >
                {#if loading}
                     <span class="text-gray-500 font-bold">Signing in...</span>
                {:else}
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-6 h-6"/>
                    <span class="text-gray-900 font-bold text-lg">Sign in with Google</span>
                {/if}
            </button>

            <p class="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                By continuing, you agree to our <a href="#" class="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" class="text-blue-500 hover:underline">Privacy Policy</a>.
            </p>
        </div>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Badge -->
    <div class="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-[10px] font-bold text-slate-500 tracking-wider">SECURE AUTHENTICATION</span>
    </div>
</div>
