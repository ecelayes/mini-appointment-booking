<script>
    import Button from '$lib/components/ui/Button.svelte';
    import Card from '$lib/components/ui/Card.svelte';
    import { Check, Calendar, Clock, MapPin, Scissors } from 'lucide-svelte';
    import { goto } from '$app/navigation';
</script>

<div class="bg-gray-50 flex flex-col items-center justify-center p-6 text-center h-full">
    
    <div class="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-8">
        <div class="bg-blue-600 rounded-full p-2">
             <Check size={40} class="text-white" strokeWidth={3} />
        </div>
    </div>

    <h1 class="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Appointment Confirmed!</h1>
    <p class="text-gray-500 mb-10 max-w-xs mx-auto">We've sent a confirmation to your email.</p>

    <!-- Details Card -->
    <Card class="w-full max-w-sm mb-10 text-left space-y-6 !p-6">
        <div class="flex items-start gap-4">
             <div class="text-blue-500 mt-1"><Scissors size={20}/></div>
             <div>
                 <p class="text-sm text-gray-400 font-medium">Service</p>
                 <p class="font-bold text-gray-900 text-lg">Men's Haircut</p>
             </div>
        </div>
        <hr class="border-gray-100" />
         <div class="flex items-start gap-4">
             <div class="text-blue-500 mt-1"><Calendar size={20}/></div>
             <div>
                 <p class="text-sm text-gray-400 font-medium">Date</p>
                 <p class="font-bold text-gray-900 text-lg">Monday, October 26, 2024</p>
             </div>
        </div>
        <hr class="border-gray-100" />
         <div class="flex items-start gap-4">
             <div class="text-blue-500 mt-1"><Clock size={20}/></div>
             <div>
                 <p class="text-sm text-gray-400 font-medium">Time</p>
                 <p class="font-bold text-gray-900 text-lg">10:30 AM</p>
             </div>
        </div>
        <hr class="border-gray-100" />
         <div class="flex items-start gap-4">
             <div class="text-blue-500 mt-1"><MapPin size={20}/></div>
             <div>
                 <p class="text-sm text-gray-400 font-medium">Location</p>
                 <p class="font-bold text-gray-900 text-lg">123 Main St, Anytown, USA</p>
             </div>
        </div>
    </Card>

    <div class="w-full max-w-sm space-y-3">

        <Button fullWidth onclick={() => goto('/home')}>
            Done
        </Button>
    </div>

</div>
