<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { api, type Service } from '$lib/services/api';
    import { onMount } from 'svelte';
    import Header from '$lib/components/layout/Header.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { ChevronLeft, ChevronRight } from 'lucide-svelte';

    let serviceId = $derived($page.params.serviceId);
    let service = $state<Service | undefined>(undefined);
    
    // Calendar State
    let currentDate = $state(new Date());
    let selectedDate = $state<Date | null>(null);
    let selectedTime = $state<string | null>(null);

    // Mock Times
    const timeSlots = [
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
        "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM"
    ];

    onMount(async () => {
        service = await api.getService(serviceId ?? '');
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let daysInMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
    let firstDayOfMonth = $derived(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()); // 0 = Sun
    
    // Calendar Generation
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

    function selectDate(day: number) {
        selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        selectedTime = null; // Reset time
    }

    async function handleConfirm() {
        if (!selectedDate || !selectedTime || !service) return;
        
        // Construct ISO date combining selectedDate + selectedTime
        // Rough implementation for mock
        const dateStr = selectedDate.toISOString(); 

        await api.createAppointment({
            serviceId: service.id,
            serviceName: service.name,
            date: dateStr,
        });

        goto('/booking/confirmation');
    }
</script>

<div class="bg-gray-50 flex flex-col pb-6">
    <Header title="Select Date & Time" backUrl="/booking/services" />
    
    <div class="flex-1 px-6 space-y-8">
        <!-- Calendar Widget -->
        <div class="bg-white p-0 rounded-none">
            <div class="flex items-center justify-between mb-6 px-2">
                 <button onclick={prevMonth} class="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                 <span class="font-bold text-gray-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                 <button onclick={nextMonth} class="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
            </div>
            
            <div class="grid grid-cols-7 text-center text-xs text-gray-400 font-medium mb-4">
                <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>

            <div class="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
                {#each calendarDays as day}
                    {#if day === null}
                        <div></div>
                    {:else}
                         <!-- svelte-ignore a11y_click_events_have_key_events -->
                         <!-- svelte-ignore a11y_no_static_element_interactions -->
                         <div 
                            class="flex items-center justify-center p-1"
                            onclick={() => selectDate(day)}
                        >
                            <div class="h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                                {selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'text-gray-900 hover:bg-gray-100'}"
                            >
                                {day}
                            </div>
                         </div>
                    {/if}
                {/each}
            </div>
        </div>

        {#if selectedDate}
            <!-- Time Slots -->
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 class="font-bold text-gray-900 mb-4 px-2">
                    Available Times on {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
                </h3>
                
                <div class="grid grid-cols-3 gap-3">
                    {#each timeSlots as time}
                        <button
                            onclick={() => selectedTime = time}
                            class="py-2.5 px-2 rounded-xl text-sm font-medium transition-all border
                            {selectedTime === time 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                                : 'bg-gray-100 text-gray-900 border-transparent hover:bg-gray-200'}"
                        >
                            {time}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    {#if selectedDate && selectedTime}
        <div class="px-6 mt-4 animate-in slide-in-from-bottom-10 duration-500 sticky bottom-6">
            <Button fullWidth onclick={handleConfirm} class="shadow-xl shadow-blue-500/20">
                Confirm
            </Button>
        </div>
    {/if}
</div>
