<script lang="ts">
  import { Plus, Trash2, Clock } from 'lucide-svelte';
  import FormModal from './FormModal.svelte';

  interface TimeSlot {
    start: string;
    end: string;
  }

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: { days: string[], slots: TimeSlot[] }) => Promise<void>;
    initialDays?: string[];
    initialSlots?: TimeSlot[];
  }

  let { isOpen, onClose, onSave, initialDays = [], initialSlots = [{ start: '09:00', end: '17:00' }] }: Props = $props();

  let selectedDays = $state<string[]>([]);
  let timeSlots = $state<TimeSlot[]>([]);
  let isClosed = $state(false);

  $effect(() => {
    if (isOpen) {
      selectedDays = [...initialDays];
      timeSlots = [...initialSlots.map(s => ({ ...s }))]; // Deep copy
      // Infer closed state from empty slots
      isClosed = initialSlots.length === 0 && initialDays.length > 0;
    }
  });

  const days = [
    { label: 'M', value: 'mon' },
    { label: 'T', value: 'tue' },
    { label: 'W', value: 'wed' },
    { label: 'T', value: 'thu' },
    { label: 'F', value: 'fri' },
    { label: 'S', value: 'sat' },
    { label: 'S', value: 'sun' },
  ];

  function toggleDay(dayPayload: string) {
    if (selectedDays.includes(dayPayload)) {
      selectedDays = selectedDays.filter(d => d !== dayPayload);
    } else {
      selectedDays = [...selectedDays, dayPayload];
    }
  }

  function addSlot() {
    timeSlots = [...timeSlots, { start: '09:00', end: '17:00' }];
  }

  function removeSlot(index: number) {
    timeSlots = timeSlots.filter((_, i) => i !== index);
  }

  async function handleSave() {
    if (selectedDays.length === 0) {
      alert('Please select at least one day');
      throw new Error('No days selected');
    }
    
    await onSave({
        days: selectedDays,
        slots: isClosed ? [] : timeSlots
    });
  }
</script>

<FormModal 
    {isOpen} 
    title="Set Availability" 
    {onClose}
    onSave={handleSave}
    isValid={selectedDays.length > 0}
    saveLabel="Save Availability"
>
    <!-- Select Days -->
    <div class="space-y-4">
        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Select Days</label>
        <div class="flex gap-2">
            {#each days as day}
                <button 
                    class={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${selectedDays.includes(day.value) ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    onclick={() => toggleDay(day.value)}
                    type="button"
                >
                    {day.label}
                </button>
            {/each}
        </div>
    </div>

    <!-- Closed Toggle -->
    <div class="flex items-center justify-between py-2">
        <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Closed</span>
        <button 
            type="button"
            class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200 dark:bg-gray-700`}
            onclick={() => isClosed = !isClosed}
        >
             <span class={`${isClosed ? 'translate-x-6 bg-blue-600' : 'translate-x-1 bg-white'} inline-block h-4 w-4 transform rounded-full transition-transform shadow-sm`}></span>
        </button>
    </div>

    <!-- Time Slots -->
    {#if !isClosed}
    <div class="space-y-4 pt-2">
        <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Time Slots</label>
        
        <div class="space-y-3">
            {#each timeSlots as slot, i}
                <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="flex-1 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400 pl-1">Start Time</label>
                        <div class="relative">
                            <input 
                                type="time" 
                                bind:value={slot.start}
                                class="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <Clock size={14} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div class="flex-1 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400 pl-1">End Time</label>
                        <div class="relative">
                            <input 
                                type="time" 
                                bind:value={slot.end}
                                class="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <Clock size={14} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <button 
                        class="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onclick={() => removeSlot(i)}
                        aria-label="Remove slot"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            {/each}
        </div>

        <button 
            onclick={addSlot}
            class="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-lg transition-colors w-max"
        >
            <Plus size={18} class="stroke-[3]" />
            Add Another Slot
        </button>
    </div>
    {/if}

</FormModal>
