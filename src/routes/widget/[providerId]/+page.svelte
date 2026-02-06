<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { api, type Service, type SlotsByPeriod } from '$lib/services/api';
    import Card from '$lib/components/ui/Card.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import Input from '$lib/components/ui/Input.svelte';
    import { Stethoscope, Scissors, Heart, Eye, Brain, PawPrint, ChevronLeft, ChevronRight, Calendar, Clock, Check, User, Phone, FileText } from 'lucide-svelte';
    import { fade, slide } from 'svelte/transition';

    let providerId = $derived($page.params.providerId);
    let step = $state(0); // 0: Services, 1: Date/Time, 2: Details, 3: Success
    
    // Data
    let services = $state<Service[]>([]);
    let selectedService = $state<Service | null>(null);
    
    // Calendar State
    let currentDate = $state(new Date());
    let selectedDate = $state<Date | null>(null);
    let selectedTime = $state<string | null>(null);
    let timeSlots = $state<SlotsByPeriod>({ am: [], pm: [] });
    
    let loading = $state(true);
    let error = $state('');
    
    // Form
    let clientName = $state('');
    let clientPhone = $state('');
    let notes = $state(''); // client notes
    let submitting = $state(false);

    const iconMap: Record<string, any> = { 'dental': Stethoscope, 'cut': Scissors, 'massage': Heart, 'eye': Eye, 'brain': Brain, 'paw': PawPrint };

    onMount(async () => {
        try {
            services = await api.getPublicServices(providerId);
        } catch(e) {
            console.error(e);
            error = "Failed to load services. Please check the URL or try again later.";
        } finally {
            loading = false;
        }
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let daysInMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
    let firstDayOfMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()); // 0 = Sun
    
    let calendarDays = $derived.by(() => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    });

    function nextMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    function prevMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    }

    function isPastDate(day: number) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    async function selectDate(day: number) {
        if (isPastDate(day)) return;
        selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        selectedTime = null;
        timeSlots = { am: [], pm: [] };
        
        if(selectedService) {
             const year = selectedDate.getFullYear();
             const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
             const d = String(selectedDate.getDate()).padStart(2, '0');
             const dateStr = `${year}-${month}-${d}`;
             try {
                timeSlots = await api.getPublicAvailableSlots(providerId, selectedService.id, dateStr);
             } catch(e) {
                console.error("Failed to fetch slots", e);
             }
        }
    }

    async function onSelectService(s: Service) {
        selectedService = s;
        step = 1;
        // Reset calendar selection when changing service? Yes usually better
        selectedDate = null;
        selectedTime = null;
    }

    function onSelectTime(t: string) {
        selectedTime = t;
    }

    function goBack() {
        if (step === 1) step = 0;
        else if (step === 2) step = 1;
    }

    async function submitBooking() {
        if(!selectedService || !selectedDate || !selectedTime) return;
        if(!clientName || !clientPhone) {
            alert("Please fill in your name and phone number.");
            return;
        }

        submitting = true;
        
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(hours);
        appointmentDate.setMinutes(minutes);
        
        try {
            await api.createPublicAppointment(providerId, {
                serviceId: selectedService.id,
                date: appointmentDate.toISOString(),
                notes,
                clientName,
                clientPhone
            });
            step = 3;
        } catch(e: any) {
            alert("Failed to book: " + e.message);
        } finally {
            submitting = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-6 px-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
        
        <!-- Headers based on step -->
        <div class="bg-blue-600 p-6 text-white text-center relative z-10 transition-all duration-300">
             {#if step > 0 && step < 3}
                <button onclick={goBack} class="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-blue-700 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
             {/if}
             <h1 class="text-xl font-bold">
                {#if step === 0} Select Service
                {:else if step === 1} Select Date & Time
                {:else if step === 2} Your Details
                {:else} Booking Confirmed! {/if}
             </h1>
             {#if step < 3 && selectedService}
                <p class="text-blue-100 text-sm mt-1 opacity-90">{selectedService.name}</p>
             {/if}
        </div>

        <div class="flex-1 p-6 relative overflow-y-auto">
            {#if error}
                <div class="p-4 bg-red-50 text-red-600 rounded-xl text-center">{error}</div>
            {:else if loading}
                <div class="flex items-center justify-center h-full text-gray-400">Loading...</div>
            {:else}
            
                <!-- STEP 0: SERVICES -->
                {#if step === 0}
                    <div class="space-y-4" in:fade={{duration: 200}}>
                        {#each services as service}
                            {@const Icon = iconMap[service.icon || ''] || Stethoscope}
                            <div 
                                class="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
                                onclick={() => onSelectService(service)}
                                role="button" aria-label="Select {service.name}" tabindex="0" onkeypress={(e)=> e.key === 'Enter' && onSelectService(service)}
                            >
                                <div class="flex items-center gap-4">
                                    <div class="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <Icon size={24} />
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-gray-900 dark:text-white">{service.name}</h3>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{service.description}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-gray-900 dark:text-white">${service.price}</div>
                                        <div class="text-xs text-gray-500">{service.duration}m</div>
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div class="text-center text-gray-500 py-10">No services found for this provider.</div>
                        {/each}
                    </div>

                <!-- STEP 1: DATE & TIME -->
                {:else if step === 1}
                    <div class="space-y-6" in:fade={{duration: 200}}>
                        <!-- Calendar Widget -->
                        <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                            <div class="flex items-center justify-between mb-4 px-2">
                                <button onclick={prevMonth} class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300"><ChevronLeft size={20}/></button>
                                <span class="font-bold text-gray-900 dark:text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                                <button onclick={nextMonth} class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300"><ChevronRight size={20}/></button>
                            </div>
                            
                            <div class="grid grid-cols-7 text-center text-xs text-gray-400 font-medium mb-3">
                                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                            </div>
            
                            <div class="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
                                {#each calendarDays as day}
                                    {#if day === null}
                                        <div></div>
                                    {:else}
                                         <button 
                                            class="flex items-center justify-center p-1 w-full"
                                            onclick={() => selectDate(day)}
                                            disabled={isPastDate(day)}
                                        >
                                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                {selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                                                    : isPastDate(day) 
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                                            >
                                                {day}
                                            </div>
                                         </button>
                                    {/if}
                                {/each}
                            </div>
                        </div>

                        <!-- Slots -->
                        {#if selectedDate}
                            <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 class="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide opacity-70">Available Times</h3>
                                
                                {#if timeSlots.am.length === 0 && timeSlots.pm.length === 0}
                                    <div class="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                        No slots available.
                                    </div>
                                {:else}
                                    <div class="space-y-4">
                                        {#if timeSlots.am.length > 0}
                                            <div>
                                                <div class="text-xs font-semibold text-gray-400 mb-2">Morning</div>
                                                <div class="grid grid-cols-3 gap-2">
                                                    {#each timeSlots.am as time}
                                                        <button onclick={() => onSelectTime(time)} class="py-2 px-1 rounded-lg text-sm font-medium border transition-all {selectedTime === time ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-blue-400'}">
                                                            {time}
                                                        </button>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}
                                        {#if timeSlots.pm.length > 0}
                                            <div>
                                                <div class="text-xs font-semibold text-gray-400 mb-2">Afternoon</div>
                                                <div class="grid grid-cols-3 gap-2">
                                                    {#each timeSlots.pm as time}
                                                        <button onclick={() => onSelectTime(time)} class="py-2 px-1 rounded-lg text-sm font-medium border transition-all {selectedTime === time ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-blue-400'}">
                                                            {time}
                                                        </button>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <Button 
                            fullWidth 
                            disabled={!selectedTime} 
                            onclick={() => step = 2}
                            class="mt-4"
                        >
                            Continue
                        </Button>
                    </div>

                <!-- STEP 2: DETAILS -->
                {:else if step === 2}
                    <div class="space-y-6" in:fade={{duration: 200}}>
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-4 items-center">
                            <div class="bg-white dark:bg-gray-800 p-2 rounded-lg text-blue-600 shadow-sm">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div class="font-bold text-gray-900 dark:text-white">
                                    {monthNames[selectedDate!.getMonth()]} {selectedDate!.getDate()}, {selectedDate!.getFullYear()}
                                </div>
                                <div class="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Clock size={14} /> {selectedTime}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="name">Full Name</label>
                                <div class="relative">
                                    <User class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="text" id="name" bind:value={clientName} placeholder="John Doe" class="w-full pl-10 h-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="phone">Phone Number</label>
                                <div class="relative">
                                    <Phone class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input type="tel" id="phone" bind:value={clientPhone} placeholder="(555) 123-4567" class="w-full pl-10 h-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="notes">Notes (Optional)</label>
                                <textarea id="notes" bind:value={notes} rows="3" placeholder="Any special requests..." class="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"></textarea>
                            </div>
                        </div>

                        <div class="pt-4">
                            <Button fullWidth onclick={submitBooking} disabled={submitting} loading={submitting}>
                                Confirm Booking
                            </Button>
                        </div>
                    </div>

                <!-- STEP 3: SUCCESS -->
                {:else if step === 3}
                     <div class="flex flex-col items-center justify-center text-center h-full py-10" in:fade={{duration: 300}}>
                        <div class="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6 animate-bounce shadow-lg shadow-green-200 dark:shadow-none">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
                        <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                            Your appointment for <span class="font-bold text-gray-900 dark:text-white">{selectedService?.name}</span> on <br/>
                            {monthNames[selectedDate!.getMonth()]} {selectedDate!.getDate()} at {selectedTime} has been scheduled.
                        </p>
                        
                        <Button variant="outline" onclick={() => location.reload()}>
                            Book Another
                        </Button>
                     </div>
                {/if}

            {/if}
        </div>
        
        <!-- Footer / Branding -->
        <div class="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
            Powered by Runik
        </div>
    </div>
</div>
