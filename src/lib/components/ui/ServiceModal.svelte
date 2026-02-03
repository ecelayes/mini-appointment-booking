<script lang="ts">
  import { 
    Briefcase, Scissors, Flower2, Heart, Dumbbell, PenTool, 
    Zap, Coffee, Music, Camera, Car, House
  } from 'lucide-svelte';
  import FormModal from './FormModal.svelte';
  import type { Service } from '$lib/services/api';

  interface Props {
    isOpen: boolean;
    service?: Service | null;
    onClose: () => void;
    onSave: (service: Partial<Service>) => Promise<void>;
  }

  let { isOpen, service = null, onClose, onSave }: Props = $props();

  let name = $state('');
  let description = $state('');
  let duration = $state(30);
  let price = $state(0);
  let icon = $state('briefcase');
  let color = $state('blue');

  // Sync state when service changes or modal opens
  $effect(() => {
    if (isOpen) {
        if (service) {
            name = service.name;
            description = service.description;
            duration = service.duration;
            price = service.price;
            icon = service.icon || 'briefcase';
            color = service.color || 'blue';
        } else {
            // Reset for create mode
            name = '';
            description = '';
            duration = 30;
            price = 0;
            icon = 'briefcase';
            color = 'blue';
        }
    }
  });

  const icons = [
    { id: 'briefcase', component: Briefcase },
    { id: 'scissors', component: Scissors },
    { id: 'flower', component: Flower2 },
    { id: 'medical', component: Heart }, // approximating medical kit
    { id: 'gym', component: Dumbbell },
    { id: 'pencil', component: PenTool }, 
    { id: 'zap', component: Zap },
    { id: 'coffee', component: Coffee },
    { id: 'music', component: Music },
    { id: 'camera', component: Camera },
    { id: 'car', component: Car },
    { id: 'house', component: House },
  ];

  const colors = [
    { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', selectedRing: 'ring-blue-500' },
    { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', selectedRing: 'ring-purple-500' },
    { id: 'green', bg: 'bg-green-100', text: 'text-green-600', selectedRing: 'ring-green-500' },
    { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', selectedRing: 'ring-orange-500' },
    { id: 'pink', bg: 'bg-pink-100', text: 'text-pink-600', selectedRing: 'ring-pink-500' },
    { id: 'red', bg: 'bg-red-100', text: 'text-red-600', selectedRing: 'ring-red-500' },
    { id: 'gray', bg: 'bg-gray-100', text: 'text-gray-600', selectedRing: 'ring-gray-500' },
  ];

  async function handleSave() {
    await onSave({
        name,
        description,
        duration,
        price,
        icon,
        color
    });
  }
</script>

<FormModal 
    {isOpen} 
    title={service ? 'Edit Service' : 'New Service'} 
    {onClose}
    onSave={handleSave}
    isValid={!!name}
    saveLabel={service ? 'Update Service' : 'Create Service'}
>
    <!-- Icon Selector -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Service Icon</label>
      <div class="flex gap-3 flex-wrap">
          {#each icons as i}
              <button 
                  class={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${icon === i.id ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  onclick={() => icon = i.id}
                  type="button"
              >
                  <i.component size={24} />
              </button>
          {/each}
      </div>
    </div>

    <!-- Color Selector -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">Color Theme</label>
      <div class="flex gap-3 flex-wrap">
          {#each colors as c}
              <button 
                  class={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${c.bg} ${c.text} ${color === c.id ? `ring-2 ring-offset-2 ${c.selectedRing} scale-110` : 'hover:scale-105'}`}
                  onclick={() => color = c.id}
                  type="button"
              >
                  {#if color === c.id}
                       <div class="w-3 h-3 rounded-full bg-current"></div>
                  {/if}
              </button>
          {/each}
      </div>
    </div>

    <!-- Name -->
    <div class="space-y-2">
        <label for="name" class="block text-sm font-medium text-gray-700">Service Name</label>
        <input 
            type="text" 
            id="name"
            bind:value={name}
            placeholder="e.g. Dental Check-up"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
    </div>

    <!-- Description -->
    <div class="space-y-2">
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <textarea 
            id="description"
            bind:value={description}
            rows="3"
            placeholder="Brief description of the service..."
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
        ></textarea>
    </div>

    <!-- Duration & Price Row -->
    <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
            <label for="duration" class="block text-sm font-medium text-gray-700">Duration (min)</label>
            <input 
                type="number" 
                id="duration"
                bind:value={duration}
                min="1"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>
        <div class="space-y-2">
            <label for="price" class="block text-sm font-medium text-gray-700">Price ($)</label>
            <input 
                type="number" 
                id="price"
                bind:value={price}
                min="0"
                step="0.01"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
        </div>
    </div>
</FormModal>
