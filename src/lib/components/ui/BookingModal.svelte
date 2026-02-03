<script lang="ts">
    import { onMount } from 'svelte';
    import Modal from './Modal.svelte';
    import { api, type Service, type Appointment } from '$lib/services/api';
    import { 
        Briefcase, Scissors, Flower2, Heart, Dumbbell, PenTool, 
        Zap, Coffee, Music, Camera, Car, House,
        ChevronLeft, ChevronRight, Check, Calendar, Clock, MapPin
    } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onSuccess: () => void;
    }

    let { isOpen, onClose, onSuccess }: Props = $props();

    // State
    let step = $state(0);
    let services = $state<Service[]>([]);
    let selectedService = $state<Service | null>(null);
    let selectedDate = $state<Date | null>(null);
    let selectedTime = $state<string | null>(null);
    let availableSlots = $state<string[]>([]);
    let loading = $state(false);
    let creating = $state(false);

    // Calendar State
    let viewDate = $state(new Date());

    // Icons Mapping (Same as ServiceModal)
    const iconMap: Record<string, any> = {
        briefcase: Briefcase, scissors: Scissors, flower: Flower2, heart: Heart, 
        medical: Heart, gym: Dumbbell, pencil: PenTool, zap: Zap, coffee: Coffee, 
        music: Music, camera: Camera, car: Car, house: House
    };

    const colorPresets: Record<string, { bg: string, text: string }> = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
        red: { bg: 'bg-red-100', text: 'text-red-600' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-600' }
    };

    function getServiceStyles(color?: string) {
        return colorPresets[color || 'blue'] || colorPresets['blue'];
    }

    // Effect: Reset when closed
    $effect(() => {
        if (!isOpen) {
            setTimeout(() => {
                step = 0;
                selectedService = null;
                selectedDate = null;
                selectedTime = null;
                availableSlots = [];
                viewDate = new Date();
            }, 300);
        }
    });

    // Effect: Load Services on Mount/Open
    $effect(() => {
        if (isOpen && services.length === 0) {
            loadServices();
        }
    });

    async function loadServices() {
        loading = true;
        try {
            services = await api.getServices();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    // Step 1: Select Service
    function selectService(service: Service) {
        selectedService = service;
        step = 1;
    }

    // Step 2: Calendar Logic
    function getDaysInMonth(date: Date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        
        const days = [];
        // Fill empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Fill days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }

    function changeMonth(delta: number) {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        viewDate = newDate;
    }

    async function selectDate(date: Date) {
        selectedDate = date;
        loading = true;
        step = 2; // Move to Step 3 (0-indexed logic: 0=Svc, 1=Date, 2=Time, 3=Confirm)
        
        try {
            // Wait a tick for UI
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            if (selectedService) {
                availableSlots = await api.getAvailableSlots(selectedService.id, dateStr);
            }
        } catch (e) {
            console.error(e);
            availableSlots = [];
        } finally {
            loading = false;
        }
    }

    // Step 3: Select Time
    function selectTime(time: string) {
        selectedTime = time;
        step = 3;
    }

    function formatTime(time: string) {
        const [h, m] = time.split(':');
        return new Date(0, 0, 0, +h, +m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
    }

    // Step 4: Confirm
    async function handleConfirm() {
        if (!selectedService || !selectedDate || !selectedTime) return;
        
        creating = true;
        try {
            // Combine Date and Time
            const date = new Date(selectedDate);
            const [h, m] = selectedTime.split(':');
            date.setHours(parseInt(h), parseInt(m));
            
            // Adjust to local ISO string somewhat or just use what api expects
            // Actually API `createAppointment` takes `date` field which usually is ISO
            // But beware of timezone conversion. 
            // Let's create a local date and use formatting to ensure backend gets correct time
            // Or use the ISO string if backend handles it
            
            await api.createAppointment({
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                date: date.toISOString(), // Backend should handle ISO
                status: 'confirmed',
                providerName: 'Online', // Placeholder
            });

            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to book appointment');
        } finally {
            creating = false;
        }
    }

    // Helpers
    function getTitle(s: number) {
        switch(s) {
            case 0: return 'Select a Service';
            case 1: return 'Select Date';
            case 2: return `Available Times on ${selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
            case 3: return 'Confirm Appointment';
            default: return 'Booking';
        }
    }

    function handleBack() {
        if (step > 0) step--;
    }

</script>

<Modal 
    {isOpen} 
    title={getTitle(step)} 
    onClose={onClose}
>
    <!-- Back Button in Header Injection? Modal doesn't support generic header injection easily without modification. 
         We'll put a back button in body if needed or generic "back" logic.
         The design has back button in header. For now, we put it at top of body or rely on Modal standard X.
         Ideally, we modify Modal to accept a left-side action. 
         Let's put it above content for now.
    -->
    
    {#if step > 0}
        <button 
            onclick={handleBack}
            class="mb-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
            <ChevronLeft size={16} class="mr-1" />
            Back
        </button>
    {/if}

    <!-- Step 0: Services -->
    {#if step === 0}
        <div class="space-y-4">
            <!-- Search bar was requested to be removed -->
            
            {#if loading}
                <div class="text-center py-8">Loading services...</div>
            {:else}
                <div class="grid grid-cols-2 gap-4">
                    {#each services as service}
                        {@const rawIcon = service.icon || 'briefcase'}
                        {@const styles = getServiceStyles(service.color)}
                        {@const Icon = iconMap[rawIcon.toLowerCase()] || Briefcase}
                        
                        <button 
                            class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col items-start gap-3 group"
                            onclick={() => selectService(service)}
                        >
                            <div class={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.bg} ${styles.text} group-hover:scale-110 transition-transform`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-900">{service.name}</h3>
                                <p class="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

    <!-- Step 1: Date -->
    {:else if step === 1}
        <div class="flex flex-col items-center">
            <div class="w-full flex items-center justify-between mb-6 px-2">
                <button onclick={() => changeMonth(-1)} class="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={20} />
                </button>
                <h3 class="font-bold text-lg">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onclick={() => changeMonth(1)} class="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div class="grid grid-cols-7 gap-2 w-full text-center mb-2">
                {#each ['S','M','T','W','T','F','S'] as day}
                    <div class="text-xs font-bold text-gray-400 py-1">{day}</div>
                {/each}
            </div>
            
            <div class="grid grid-cols-7 gap-2 w-full">
                {#each getDaysInMonth(viewDate) as date}
                    {#if date}
                        {@const isToday = date.toDateString() === new Date().toDateString()}
                        {@const isPast = date < new Date(new Date().setHours(0,0,0,0))}
                        <button
                            disabled={isPast}
                            onclick={() => selectDate(date)}
                            class={`
                                h-10 w-10 text-sm font-medium rounded-full flex items-center justify-center transition-all
                                ${isToday ? 'bg-blue-50 text-blue-600 font-bold' : ''}
                                ${selectedDate?.toDateString() === date.toDateString() ? '!bg-blue-600 !text-white transform scale-110 shadow-lg' : ''}
                                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-900'}
                            `}
                        >
                            {date.getDate()}
                        </button>
                    {:else}
                        <div></div>
                    {/if}
                {/each}
            </div>
        </div>

    <!-- Step 2: Time -->
    {:else if step === 2}
        {#if loading}
            <div class="flex items-center justify-center h-40">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        {:else if availableSlots.length === 0}
             <div class="text-center py-10">
                <p class="text-gray-500">No available slots on this date.</p>
                <button onclick={() => step--} class="text-blue-600 text-sm font-semibold mt-2">Try another date</button>
             </div>
        {:else}
            <div class="grid grid-cols-3 gap-3">
                {#each availableSlots as slot}
                    <button
                        class="py-2 px-3 rounded-lg text-sm font-semibold bg-gray-50 text-gray-900 border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        onclick={() => selectTime(slot)}
                    >
                        {formatTime(slot)}
                    </button>
                {/each}
            </div>
        {/if}

    <!-- Step 3: Confirm -->
    {:else if step === 3}
         {@const rawIcon = selectedService?.icon || 'briefcase'}
         {@const SelectedIcon = iconMap[rawIcon.toLowerCase()] || Briefcase}
         {@const selectedStyles = getServiceStyles(selectedService?.color)}
         <div class="space-y-6">
            <!-- Review Card -->
            <div class="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div class="flex items-start gap-4">
                    <div class={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedStyles.bg} ${selectedStyles.text}`}>
                        <SelectedIcon size={24} />
                    </div>
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service</p>
                        <h3 class="font-bold text-gray-900 text-lg">{selectedService?.name}</h3>
                        <p class="text-sm text-gray-500">{selectedService?.duration || 30} min</p>
                    </div>
                </div>

                <div class="h-px bg-gray-200 w-full"></div>

                <div class="grid grid-cols-2 gap-4">
                     <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                        <div class="flex items-center gap-2 text-gray-900 font-semibold">
                            <Calendar size={16} class="text-blue-500" />
                            {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                     </div>
                     <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</p>
                         <div class="flex items-center gap-2 text-gray-900 font-semibold">
                            <Clock size={16} class="text-blue-500" />
                            {selectedTime ? formatTime(selectedTime) : ''}
                        </div>
                     </div>
                </div>

                 <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                     <div class="flex items-center gap-2 text-gray-900 font-semibold">
                        <MapPin size={16} class="text-blue-500" />
                        Online
                    </div>
                 </div>
            </div>

            <button 
                onclick={handleConfirm}
                disabled={creating}
                class="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-blue-200 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {#if creating}
                     Processing...
                {:else}
                    Confirm Appointment
                {/if}
            </button>     
         </div>
    {/if}

</Modal>
